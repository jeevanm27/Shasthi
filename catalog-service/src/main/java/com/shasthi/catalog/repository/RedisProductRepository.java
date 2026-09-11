package com.shasthi.catalog.repository;

import com.redis.om.spring.repository.RedisDocumentRepository;
import com.shasthi.catalog.model.Product;

import java.util.List;

/**
 * Redis OM repository — backed by RediSearch (FT.SEARCH).
 * Spring Data naming conventions generate queries automatically.
 */
public interface RedisProductRepository
        extends RedisDocumentRepository<Product, String> {

    /** Full-text search on 'name' field */
    List<Product> findByName(String name);

    /** Filter by category TAG */
    List<Product> findByCategory(String category);

    /** Filter by availability */
    List<Product> findByAvailable(Boolean available);

    /** Full-text search on name, filtered by available = true */
    List<Product> findByNameAndAvailable(String name, Boolean available);
}
