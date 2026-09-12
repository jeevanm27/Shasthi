package com.shasthi.catalog.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.shasthi.catalog.model.Product;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

/**
 * Simple Redis cache for product JSON blobs.
 * Uses StringRedisTemplate — no external libraries required.
 * Key pattern: product:<uuid>
 * TTL: 30 minutes
 */
@Component
public class RedisProductRepository {

    private static final Logger log    = LoggerFactory.getLogger(RedisProductRepository.class);
    private static final String PREFIX = "product:";
    private static final Duration TTL  = Duration.ofMinutes(30);

    private final StringRedisTemplate redis;
    private final ObjectMapper        mapper;

    public RedisProductRepository(StringRedisTemplate redis) {
        this.redis  = redis;
        this.mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /** Cache a product as JSON */
    public void save(Product product) {
        try {
            String json = mapper.writeValueAsString(product);
            redis.opsForValue().set(PREFIX + product.getId(), json, TTL);
        } catch (JsonProcessingException e) {
            log.warn("[cache] Could not serialize product {}: {}", product.getId(), e.getMessage());
        }
    }

    /** Read a product from cache */
    public Optional<Product> findById(String id) {
        try {
            String json = redis.opsForValue().get(PREFIX + id);
            if (json == null) return Optional.empty();
            return Optional.of(mapper.readValue(json, Product.class));
        } catch (Exception e) {
            log.warn("[cache] Could not deserialize product {}: {}", id, e.getMessage());
            return Optional.empty();
        }
    }

    /** Evict a product from cache */
    public void deleteById(String id) {
        redis.delete(PREFIX + id);
    }
}
