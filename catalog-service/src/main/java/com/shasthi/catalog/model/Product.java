package com.shasthi.catalog.model;

import com.redis.om.spring.annotations.Document;
import com.redis.om.spring.annotations.Indexed;
import com.redis.om.spring.annotations.Searchable;
import org.springframework.data.annotation.Id;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Dual-purpose model:
 * - Mapped to the 'products' PostgreSQL table via JdbcTemplate
 * - Stored as a Redis Document (JSON) for sub-millisecond FT.SEARCH queries
 */
@Document(indexName = "idx:products", prefixes = {"product:"})
public class Product {

    @Id
    private String id;          // UUID as String (Redis OM needs String ID)

    @Indexed
    private String slug;

    @Searchable(weight = 2.0)   // Higher weight = more relevant in FT.SEARCH
    private String name;

    @Indexed                    // TAG field — exact match filtering
    private String category;

    @Searchable
    private String description;

    private BigDecimal pricePerGram;

    private Integer stockQuantity;

    private String imageUrl;

    @Indexed
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
