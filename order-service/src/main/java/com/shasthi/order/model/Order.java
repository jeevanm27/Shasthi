package com.shasthi.order.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class Order {
    private String          id;
    private String          eventId;      // Kafka event ID (idempotency key)
    private String          userId;
    private String          userEmail;
    private BigDecimal      totalPrice;
    private String          status;
    private OffsetDateTime  createdAt;
    private OffsetDateTime  updatedAt;
    private List<OrderItem> items;

    //  Getters / Setters 
    public String getId()                         { return id; }
    public void   setId(String id)                { this.id = id; }

    public String getEventId()                    { return eventId; }
    public void   setEventId(String eventId)      { this.eventId = eventId; }

    public String getUserId()                     { return userId; }
    public void   setUserId(String userId)        { this.userId = userId; }

    public String getUserEmail()                  { return userEmail; }
    public void   setUserEmail(String e)          { this.userEmail = e; }

    public BigDecimal getTotalPrice()             { return totalPrice; }
    public void       setTotalPrice(BigDecimal p) { this.totalPrice = p; }

    public String getStatus()                     { return status; }
    public void   setStatus(String status)        { this.status = status; }

    public OffsetDateTime getCreatedAt()          { return createdAt; }
    public void           setCreatedAt(OffsetDateTime t) { this.createdAt = t; }

    public OffsetDateTime getUpdatedAt()          { return updatedAt; }
    public void           setUpdatedAt(OffsetDateTime t) { this.updatedAt = t; }

    public List<OrderItem> getItems()             { return items; }
    public void            setItems(List<OrderItem> items) { this.items = items; }
}
