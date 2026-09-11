package com.shasthi.catalog.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shasthi.catalog.model.Product;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.concurrent.TimeUnit;

/**
 * Simple Redis cache using StringRedisTemplate + Jackson JSON.
 * Replaces redis-om-spring which is not on Maven Central.
 *
 * Cache strategy:
 *  - Key: "product:<id>"   → JSON of the Product
 *  - TTL: 30 minutes
 *
 * Full-text search is handled by Postgres ILIKE in ProductService.
 */
@Repository
public class RedisProductRepository {

    private static final Logger log = LoggerFactory.getLogger(RedisProductRepository.class);
    private static final String KEY_PREFIX = "product:";
    private static final long   TTL_MINUTES = 30;

    private final StringRedisTemplate redis;
    private final ObjectMapper        mapper;

    public RedisProductRepository(StringRedisTemplate redis, ObjectMapper mapper) {
        this.redis  = redis;
        this.mapper = mapper;
    }

    /** Store product JSON in Redis with TTL. */
    public void save(Product p) {
        try {
            String json = mapper.writeValueAsString(p);
            redis.opsForValue().set(KEY_PREFIX + p.getId(), json, TTL_MINUTES, TimeUnit.MINUTES);
        } catch (JsonProcessingException ex) {
            log.warn("[redis-cache] Failed to serialize product {}: {}", p.getId(), ex.getMessage());
        }
    }

    /** Remove a product from the cache. */
    public void deleteById(String id) {
        redis.delete(KEY_PREFIX + id);
    }

    /** Evict all cached products (call after bulk updates). */
    public void evictAll() {
        var keys = redis.keys(KEY_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) redis.delete(keys);
    }
}
