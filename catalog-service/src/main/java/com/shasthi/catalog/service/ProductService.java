package com.shasthi.catalog.service;

import com.shasthi.catalog.model.Product;
import com.shasthi.catalog.repository.ProductRepository;
import com.shasthi.catalog.repository.RedisProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository       pgRepo;
    private final RedisProductRepository  redisRepo;

    public ProductService(ProductRepository pgRepo, RedisProductRepository redisRepo) {
        this.pgRepo   = pgRepo;
        this.redisRepo = redisRepo;
    }

    // ─── Customer-facing: paginated product list (from Postgres) ─────────────
    public List<Product> listProducts(int page, int size) {
        int offset = (page - 1) * size;
        return pgRepo.findAll(size, offset);
    }

    public int countProducts() {
        return pgRepo.count();
    }

    // ─── Customer-facing: sub-millisecond search via Redis ───────────────────
    public List<Product> searchProducts(String query) {
        try {
            // Search by name, only return available products
            return redisRepo.findByNameAndAvailable(query, true);
        } catch (Exception ex) {
            log.warn("[catalog] Redis search failed, falling back to Postgres ILIKE: {}", ex.getMessage());
            // Graceful degradation: fall back to Postgres if Redis is unavailable
            return pgRepo.findAll(50, 0).stream()
                    .filter(p -> Boolean.TRUE.equals(p.getAvailable()))
                    .filter(p -> p.getName().toLowerCase().contains(query.toLowerCase()))
                    .toList();
        }
    }

    // ─── Public: get by ID ───────────────────────────────────────────────────
    public Optional<Product> getById(String id) {
        return pgRepo.findById(id);
    }

    // ─── Admin: create ───────────────────────────────────────────────────────
    public Product createProduct(Product p) {
        Product saved = pgRepo.create(p);
        syncToRedis(saved);
        return saved;
    }

    // ─── Admin: update ───────────────────────────────────────────────────────
    public Optional<Product> updateProduct(String id, Product p) {
        Optional<Product> updated = pgRepo.update(id, p);
        updated.ifPresent(this::syncToRedis);
        return updated;
    }

    // ─── Admin: delete ───────────────────────────────────────────────────────
    public boolean deleteProduct(String id) {
        boolean deleted = pgRepo.deleteById(id);
        if (deleted) {
            try {
                redisRepo.deleteById(id);
                log.debug("[catalog] Removed product {} from Redis index", id);
            } catch (Exception ex) {
                log.warn("[catalog] Failed to remove product {} from Redis: {}", id, ex.getMessage());
            }
        }
        return deleted;
    }

    // ─── Internal: sync Postgres product to Redis OM index ───────────────────
    private void syncToRedis(Product p) {
        try {
            redisRepo.save(p);
            log.debug("[catalog] Synced product {} '{}' to Redis index", p.getId(), p.getName());
        } catch (Exception ex) {
            // Don't fail the request if Redis sync fails — Postgres is source of truth
            log.warn("[catalog] Redis sync failed for product {}: {}", p.getId(), ex.getMessage());
        }
    }
}
