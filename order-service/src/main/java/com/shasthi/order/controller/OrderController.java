package com.shasthi.order.controller;

import com.shasthi.order.model.Order;
import com.shasthi.order.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Set<String> VALID_STATUSES =
            Set.of("PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED");

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    //  GET /api/orders   Admin: all orders 
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(service.getAllOrders());
    }

    //  GET /api/orders/my   Customer: their own orders 
    @GetMapping("/my")
    public ResponseEntity<List<Order>> getMyOrders(HttpServletRequest req) {
        String userId = (String) req.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(service.getOrdersByUser(userId));
    }

    //  PUT /api/orders/:id/status   Admin: update status 
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        String status = body.get("status");
        if (status == null || !VALID_STATUSES.contains(status.toUpperCase())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid status. Must be one of: " + VALID_STATUSES));
        }

        return service.updateStatus(id, status.toUpperCase())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
