package com.shasthi.catalog.repository;

import com.shasthi.catalog.model.Product;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ProductRepository {

    private final JdbcTemplate jdbc;

    public ProductRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    //  RowMapper 
    private final RowMapper<Product> productRowMapper = (rs, rowNum) -> {
        Product p = new Product();
        p.setId(rs.getString("id"));
        p.setSlug(rs.getString("slug"));
        p.setName(rs.getString("name"));
        p.setCategory(rs.getString("category"));
        p.setDescription(rs.getString("description"));
        p.setPricePerGram(rs.getBigDecimal("price_per_gram"));
        p.setStockQuantity(rs.getInt("stock_quantity"));
        p.setImageUrl(rs.getString("image_url"));
        p.setAvailable(rs.getBoolean("available"));
        if (rs.getTimestamp("created_at") != null) {
            p.setCreatedAt(rs.getTimestamp("created_at").toInstant()
                    .atOffset(java.time.ZoneOffset.UTC));
        }
        if (rs.getTimestamp("updated_at") != null) {
            p.setUpdatedAt(rs.getTimestamp("updated_at").toInstant()
                    .atOffset(java.time.ZoneOffset.UTC));
        }
        return p;
    };

    //  Queries 

    public List<Product> findAll(int limit, int offset) {
        return jdbc.query(
            "SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?",
            productRowMapper, limit, offset
        );
    }

    public Optional<Product> findById(String id) {
        List<Product> results = jdbc.query(
            "SELECT * FROM products WHERE id = ?::uuid",
            productRowMapper, id
        );
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<Product> findBySlug(String slug) {
        List<Product> results = jdbc.query(
            "SELECT * FROM products WHERE slug = ?",
            productRowMapper, slug
        );
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Product create(Product p) {
        String id = UUID.randomUUID().toString();
        jdbc.update(
            """
            INSERT INTO products (id, slug, name, category, description,
                                  price_per_gram, stock_quantity, image_url, available)
            VALUES (?::uuid, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            id, p.getSlug(), p.getName(), p.getCategory(), p.getDescription(),
            p.getPricePerGram(), p.getStockQuantity(), p.getImageUrl(), p.getAvailable()
        );
        return findById(id).orElseThrow();
    }

    public Optional<Product> update(String id, Product p) {
        int rows = jdbc.update(
            """
            UPDATE products
            SET slug = ?, name = ?, category = ?, description = ?,
                price_per_gram = ?, stock_quantity = ?, image_url = ?,
                available = ?, updated_at = NOW()
            WHERE id = ?::uuid
            """,
            p.getSlug(), p.getName(), p.getCategory(), p.getDescription(),
            p.getPricePerGram(), p.getStockQuantity(), p.getImageUrl(),
            p.getAvailable(), id
        );
        return rows == 0 ? Optional.empty() : findById(id);
    }

    public boolean deleteById(String id) {
        return jdbc.update("DELETE FROM products WHERE id = ?::uuid", id) > 0;
    }

    public int count() {
        Integer c = jdbc.queryForObject("SELECT COUNT(*) FROM products", Integer.class);
        return c == null ? 0 : c;
    }

    /** Full-text search using Postgres ILIKE on name and description. */
    public List<Product> search(String query) {
        String pattern = "%" + query.toLowerCase() + "%";
        return jdbc.query(
            """
            SELECT * FROM products
            WHERE available = true
              AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)
            ORDER BY
              CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END,
              name ASC
            LIMIT 50
            """,
            productRowMapper, pattern, pattern, pattern
        );
    }
}
