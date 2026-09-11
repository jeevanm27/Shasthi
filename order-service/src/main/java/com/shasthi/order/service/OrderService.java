package com.shasthi.order.service;

import com.shasthi.order.model.Order;
import com.shasthi.order.model.OrderCreatedEvent;
import com.shasthi.order.model.OrderItem;
import com.shasthi.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private final OrderRepository repo;

    public OrderService(OrderRepository repo) {
        this.repo = repo;
    }

    /**
     * Process a Kafka order-created event.
     *
     * This method runs in a single DB transaction:
     *  1. Idempotency check (skip if already processed)
     *  2. Deduct stock for EVERY item atomically
     *  3. Insert order + order_items
     *  4. Commit
     *
     * If ANY stock deduction fails, the entire transaction rolls back,
     * and the order is inserted as CANCELLED in a separate transaction.
     */
    @Transactional
    public void processOrder(OrderCreatedEvent event) {
        String eventId = event.getEventId();

        //  Idempotency: skip if Kafka re-delivers this event 
        if (repo.eventAlreadyProcessed(eventId)) {
            log.info("[order] Duplicate event {} skipped (already processed)", eventId);
            return;
        }

        log.info("[order] Processing event {} for user {}", eventId, event.getUserId());

        //  Build order items list 
        List<OrderItem> items = new ArrayList<>();
        for (OrderCreatedEvent.EventItem ei : event.getItems()) {
            OrderItem item = new OrderItem();
            item.setProductId(ei.getProductId());
            item.setProductName(ei.getProductName());
            item.setQuantityGrams(ei.getQuantityGrams());
            item.setPriceLocked(ei.getPricePerGram());
            items.add(item);
        }

        //  Deduct stock for every item (fail-fast on insufficient stock) 
        List<String> failedProducts = new ArrayList<>();
        for (OrderItem item : items) {
            boolean ok = repo.deductStock(item.getProductId(), item.getQuantityGrams());
            if (!ok) {
                failedProducts.add(item.getProductName());
            }
        }

        if (!failedProducts.isEmpty()) {
            log.warn("[order] Insufficient stock for: {}  event {}", failedProducts, eventId);
            // Insert the order as CANCELLED so the user can see what happened
            // This runs in the same transaction which will be committed
            String orderId = repo.insertOrder(
                eventId, event.getUserId(), event.getUserEmail(), event.getTotalPrice()
            );
            repo.cancelOrder(orderId);
            repo.insertOrderItems(orderId, items);
            return;
        }

        //  All stock deducted  insert the order as PENDING 
        String orderId = repo.insertOrder(
            eventId, event.getUserId(), event.getUserEmail(), event.getTotalPrice()
        );
        repo.insertOrderItems(orderId, items);
        log.info("[order] Order {} created successfully for event {}", orderId, eventId);
    }

    //  Admin: all orders with items 
    public List<Order> getAllOrders() {
        List<Order> orders = repo.findAll();
        orders.forEach(o -> o.setItems(repo.findItemsByOrderId(o.getId())));
        return orders;
    }

    //  Customer: their orders 
    public List<Order> getOrdersByUser(String userId) {
        List<Order> orders = repo.findByUserId(userId);
        orders.forEach(o -> o.setItems(repo.findItemsByOrderId(o.getId())));
        return orders;
    }

    //  Admin: update status 
    public Optional<Order> updateStatus(String orderId, String status) {
        return repo.updateStatus(orderId, status);
    }
}
