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

    private final ProductRepository      pgRepo;
    private final RedisProductRepository cache;

    public ProductService(ProductRepository pgRepo, RedisProductRepository cache) {
        this.pgRepo = pgRepo;
        this.cache  = cache;
    }

    // ─── Customer: paginated list (Postgres) ─────────────────────────────────
    public List<Product> listProducts(int page, int size) {
        int offset = (page - 1) * size;
        return pgRepo.findAll(size, offset);
    }

    public int countProducts() {
        return pgRepo.count();
    }

    // ─── Customer: search via Postgres ILIKE (Redis not needed for FT.SEARCH) ─
    // Redis Stack FT.SEARCH requires manual index creation at startup.
    // Using Postgres full-text ILIKE is reliable and correct for our scale.
    public List<Product> searchProducts(String query) {
        return pgRepo.search(query);
    }

    // ─── Customer: get by ID (cache-aside) ───────────────────────────────────
    public Optional<Product> getById(String id) {
        Optional<Product> cached = Optional.empty();
        try {
            cached = cache.findById(id);
        } catch (Exception ex) {
            log.warn("[catalog] Redis read failed for {}: {}", id, ex.getMessage());
        }
        if (cached.isPresent()) return cached;

        Optional<Product> fromDb = pgRepo.findById(id);
        fromDb.ifPresent(p -> {
            try { cache.save(p); } catch (Exception ex) { /* non-fatal */ }
        });
        return fromDb;
    }

    // ─── Admin: create ───────────────────────────────────────────────────────
    public Product createProduct(Product p) {
        Product saved = pgRepo.create(p);
        syncToCache(saved);
        return saved;
    }

    // ─── Admin: update ───────────────────────────────────────────────────────
    public Optional<Product> updateProduct(String id, Product p) {
        Optional<Product> updated = pgRepo.update(id, p);
        updated.ifPresent(this::syncToCache);
        return updated;
    }

    // ─── Admin: delete ───────────────────────────────────────────────────────
    public boolean deleteProduct(String id) {
        boolean deleted = pgRepo.deleteById(id);
        if (deleted) {
            try {
                cache.deleteById(id);
                log.debug("[catalog] Evicted product {} from Redis cache", id);
            } catch (Exception ex) {
                log.warn("[catalog] Cache eviction failed for {}: {}", id, ex.getMessage());
            }
        }
        return deleted;
    }

    // ─── Internal ────────────────────────────────────────────────────────────
    private void syncToCache(Product p) {
        try {
            cache.save(p);
            log.debug("[catalog] Cached product {} '{}'", p.getId(), p.getName());
        } catch (Exception ex) {
            log.warn("[catalog] Cache sync failed for {}: {}", p.getId(), ex.getMessage());
        }
    }
}
