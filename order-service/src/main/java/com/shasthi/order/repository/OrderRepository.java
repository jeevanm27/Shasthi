package com.shasthi.order.repository;

import com.shasthi.order.model.Order;
import com.shasthi.order.model.OrderItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class OrderRepository {

    private static final Logger log = LoggerFactory.getLogger(OrderRepository.class);
    private final JdbcTemplate jdbc;

    public OrderRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    //  RowMappers 
    private final RowMapper<Order> orderRowMapper = (rs, rowNum) -> {
        Order o = new Order();
        o.setId(rs.getString("id"));
        o.setEventId(rs.getString("event_id"));
        o.setUserId(rs.getString("user_id"));
        o.setUserEmail(rs.getString("user_email"));
        o.setTotalPrice(rs.getBigDecimal("total_price"));
        o.setStatus(rs.getString("status"));
        if (rs.getTimestamp("created_at") != null)
            o.setCreatedAt(rs.getTimestamp("created_at").toInstant().atOffset(java.time.ZoneOffset.UTC));
        if (rs.getTimestamp("updated_at") != null)
            o.setUpdatedAt(rs.getTimestamp("updated_at").toInstant().atOffset(java.time.ZoneOffset.UTC));
        return o;
    };

    private final RowMapper<OrderItem> itemRowMapper = (rs, rowNum) -> {
        OrderItem i = new OrderItem();
        i.setId(rs.getString("id"));
        i.setOrderId(rs.getString("order_id"));
        i.setProductId(rs.getString("product_id"));
        i.setProductName(rs.getString("product_name"));
        i.setQuantityGrams(rs.getInt("quantity_grams"));
        i.setPriceLocked(rs.getBigDecimal("price_locked"));
        return i;
    };

    //  Check idempotency: has this Kafka event already been processed? 
    public boolean eventAlreadyProcessed(String eventId) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM orders WHERE event_id = ?", Integer.class, eventId
        );
        return count != null && count > 0;
    }

    //  Atomic inventory deduction (called inside @Transactional) 
    /**
     * Deducts stock for a product.
     * Uses a conditional UPDATE to prevent overselling.
     *
     * @return true if deduction succeeded, false if insufficient stock
     */
    public boolean deductStock(String productId, int quantityGrams) {
        int rows = jdbc.update(
            """
            UPDATE products
            SET    stock_quantity = stock_quantity - ?,
                   updated_at    = NOW()
            WHERE  id = ?::uuid
            AND    stock_quantity >= ?
            """,
            quantityGrams, productId, quantityGrams
        );
        if (rows == 0) {
            log.warn("[order] Insufficient stock for product {} (requested {} grams)", productId, quantityGrams);
        }
        return rows > 0;
    }

    //  Insert a new order 
    public String insertOrder(String eventId, String userId, String userEmail,
                              java.math.BigDecimal totalPrice) {
        String id = UUID.randomUUID().toString();
        jdbc.update(
            """
            INSERT INTO orders (id, event_id, user_id, user_email, total_price, status)
            VALUES (?::uuid, ?, ?::uuid, ?, ?, 'PENDING'::order_status)
            """,
            id, eventId, userId, userEmail, totalPrice
        );
        return id;
    }

    //  Batch insert order items 
    public void insertOrderItems(String orderId, List<OrderItem> items) {
        for (OrderItem item : items) {
            jdbc.update(
                """
                INSERT INTO order_items (id, order_id, product_id, product_name, quantity_grams, price_locked)
                VALUES (?::uuid, ?::uuid, ?::uuid, ?, ?, ?)
                """,
                UUID.randomUUID().toString(), orderId,
                item.getProductId(), item.getProductName(),
                item.getQuantityGrams(), item.getPriceLocked()
            );
        }
    }

    //  Mark order as CANCELLED 
    public void cancelOrder(String orderId) {
        jdbc.update(
            "UPDATE orders SET status = 'CANCELLED'::order_status, updated_at = NOW() WHERE id = ?::uuid",
            orderId
        );
    }

    //  Admin: all orders 
    public List<Order> findAll() {
        return jdbc.query(
            "SELECT * FROM orders ORDER BY created_at DESC",
            orderRowMapper
        );
    }

    //  Customer: their own orders 
    public List<Order> findByUserId(String userId) {
        return jdbc.query(
            "SELECT * FROM orders WHERE user_id = ?::uuid ORDER BY created_at DESC",
            orderRowMapper, userId
        );
    }

    //  Items for an order 
    public List<OrderItem> findItemsByOrderId(String orderId) {
        return jdbc.query(
            "SELECT * FROM order_items WHERE order_id = ?::uuid",
            itemRowMapper, orderId
        );
    }

    //  Admin: update status 
    public Optional<Order> updateStatus(String orderId, String status) {
        int rows = jdbc.update(
            "UPDATE orders SET status = ?::order_status, updated_at = NOW() WHERE id = ?::uuid",
            status, orderId
        );
        if (rows == 0) return Optional.empty();
        List<Order> result = jdbc.query(
            "SELECT * FROM orders WHERE id = ?::uuid", orderRowMapper, orderId
        );
        return result.isEmpty() ? Optional.empty() : Optional.of(result.get(0));
    }
}
