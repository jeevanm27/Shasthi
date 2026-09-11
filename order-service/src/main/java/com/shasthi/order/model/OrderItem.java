package com.shasthi.order.model;

import java.math.BigDecimal;

public class OrderItem {
    private String     id;
    private String     orderId;
    private String     productId;
    private String     productName;
    private Integer    quantityGrams;
    private BigDecimal priceLocked;

    // ─── Getters / Setters ────────────────────────────────────────────────────
    public String getId()                          { return id; }
    public void   setId(String id)                 { this.id = id; }

    public String getOrderId()                     { return orderId; }
    public void   setOrderId(String orderId)       { this.orderId = orderId; }

    public String getProductId()                   { return productId; }
    public void   setProductId(String productId)   { this.productId = productId; }

    public String getProductName()                 { return productName; }
    public void   setProductName(String n)         { this.productName = n; }

    public Integer getQuantityGrams()              { return quantityGrams; }
    public void    setQuantityGrams(Integer q)     { this.quantityGrams = q; }

    public BigDecimal getPriceLocked()             { return priceLocked; }
    public void       setPriceLocked(BigDecimal p) { this.priceLocked = p; }
}
