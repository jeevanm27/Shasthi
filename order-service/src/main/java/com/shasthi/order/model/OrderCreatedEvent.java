package com.shasthi.order.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;

/**
 * Deserialized from the Kafka 'order-created' topic message value.
 * Shape must exactly match what user-service's kafka/producer.js emits.
 */
public class OrderCreatedEvent {

    @JsonProperty("eventId")
    private String eventId;

    @JsonProperty("userId")
    private String userId;

    @JsonProperty("userEmail")
    private String userEmail;

    @JsonProperty("items")
    private List<EventItem> items;

    @JsonProperty("totalPrice")
    private BigDecimal totalPrice;

    @JsonProperty("createdAt")
    private String createdAt;

    // ─── Nested item class ────────────────────────────────────────────────────
    public static class EventItem {
        @JsonProperty("productId")
        private String productId;

        @JsonProperty("productName")
        private String productName;

        @JsonProperty("quantityGrams")
        private Integer quantityGrams;

        @JsonProperty("pricePerGram")
        private BigDecimal pricePerGram;

        public String     getProductId()    { return productId; }
        public String     getProductName()  { return productName; }
        public Integer    getQuantityGrams(){ return quantityGrams; }
        public BigDecimal getPricePerGram() { return pricePerGram; }
    }

    // ─── Getters ──────────────────────────────────────────────────────────────
    public String          getEventId()    { return eventId; }
    public String          getUserId()     { return userId; }
    public String          getUserEmail()  { return userEmail; }
    public List<EventItem> getItems()      { return items; }
    public BigDecimal      getTotalPrice() { return totalPrice; }
    public String          getCreatedAt()  { return createdAt; }
}
