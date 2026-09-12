package com.shasthi.catalog.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Plain POJO mapped to the 'products' PostgreSQL table via JdbcTemplate.
 * Redis caching is handled in ProductService using StringRedisTemplate + JSON.
 */
public class Product {

    private String id;
    private String slug;
    private String name;
    private String category;
    private String description;
    private BigDecimal pricePerGram;
    private Integer stockQuantity;
    private String imageUrl;
    private Boolean available;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // ─── Constructors ─────────────────────────────────────────────────────────
    public Product() {}

    // ─── Getters / Setters ────────────────────────────────────────────────────
    public String getId()                       { return id; }
    public void   setId(String id)              { this.id = id; }

    public String getSlug()                     { return slug; }
    public void   setSlug(String slug)          { this.slug = slug; }

    public String getName()                     { return name; }
    public void   setName(String name)          { this.name = name; }

    public String getCategory()                 { return category; }
    public void   setCategory(String category)  { this.category = category; }

    public String getDescription()                    { return description; }
    public void   setDescription(String description)  { this.description = description; }

    public BigDecimal getPricePerGram()                    { return pricePerGram; }
    public void       setPricePerGram(BigDecimal p)        { this.pricePerGram = p; }

    public Integer getStockQuantity()                  { return stockQuantity; }
    public void    setStockQuantity(Integer s)         { this.stockQuantity = s; }

    public String getImageUrl()                        { return imageUrl; }
    public void   setImageUrl(String imageUrl)         { this.imageUrl = imageUrl; }

    public Boolean getAvailable()                      { return available; }
    public void    setAvailable(Boolean available)     { this.available = available; }

    public OffsetDateTime getCreatedAt()               { return createdAt; }
    public void           setCreatedAt(OffsetDateTime t) { this.createdAt = t; }

    public OffsetDateTime getUpdatedAt()               { return updatedAt; }
    public void           setUpdatedAt(OffsetDateTime t) { this.updatedAt = t; }
}
