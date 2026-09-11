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
    private final RedisProductRepository redisCache;

    public ProductService(ProductRepository pgRepo, RedisProductRepository redisCache) {
        this.pgRepo     = pgRepo;
        this.redisCache = redisCache;
    }

    //  Customer-facing: paginated product list (Postgres) 
    public List<Product> listProducts(int page, int size) {
        int offset = (page - 1) * size;
        return pgRepo.findAll(size, offset);
    }

    public int countProducts() {
        return pgRepo.count();
    }

    //  Customer-facing: full-text search (Postgres ILIKE) 
    // Redis OM / FT.SEARCH was removed (artifact not on Maven Central).
    // Postgres ILIKE on name+description is fast enough for this scale.
    public List<Product> searchProducts(String query) {
        try {
            return pgRepo.search(query);
        } catch (Exception ex) {
            log.warn("[catalog] Postgres search failed: {}", ex.getMessage());
            return List.of();
        }
    }

    //  Get by ID 
    public Optional<Product> getById(String id) {
        return pgRepo.findById(id);
    }

    //  Admin: create 
    public Product createProduct(Product p) {
        Product saved = pgRepo.create(p);
        warmCache(saved);
        return saved;
    }

    //  Admin: update 
    public Optional<Product> updateProduct(String id, Product p) {
        Optional<Product> updated = pgRepo.update(id, p);
        updated.ifPresent(this::warmCache);
        return updated;
    }

    //  Admin: delete 
    public boolean deleteProduct(String id) {
        boolean deleted = pgRepo.deleteById(id);
        if (deleted) {
            try {
                redisCache.deleteById(id);
            } catch (Exception ex) {
                log.warn("[catalog] Redis evict failed for {}: {}", id, ex.getMessage());
            }
        }
        return deleted;
    }

    //  Internal: warm Redis cache 
    private void warmCache(Product p) {
        try {
            redisCache.save(p);
        } catch (Exception ex) {
            // Redis is a cache, not source of truth  don't fail the request
            log.warn("[catalog] Redis cache warm failed for {}: {}", p.getId(), ex.getMessage());
        }
    }
}
