package com.shasthi.orders;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {
  private final ConcurrentHashMap<String, OrderResponse> orders = new ConcurrentHashMap<>();
  private final String adminKey;

  OrderController(@Value("${ADMIN_KEY:shasthi-admin}") String adminKey) {
    this.adminKey = adminKey;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  OrderResponse create(@Valid @RequestBody CreateOrderRequest request) {
    BigDecimal total = request.items().stream()
        .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    String id = UUID.randomUUID().toString();
    OrderResponse order = new OrderResponse(id, "CONFIRMED", request.customerName(), request.email(), request.items(), total, Instant.now());
    orders.put(id, order);
    return order;
  }

  @GetMapping("/{id}")
  OrderResponse get(@PathVariable String id, @RequestHeader("X-Admin-Key") String suppliedKey) {
    requireAdmin(suppliedKey);
    OrderResponse order = orders.get(id);
    if (order == null) throw new OrderNotFoundException();
    return order;
  }

  @GetMapping
  List<OrderResponse> list(@RequestHeader("X-Admin-Key") String suppliedKey) {
    requireAdmin(suppliedKey);
    return orders.values().stream().sorted((a, b) -> b.createdAt().compareTo(a.createdAt())).toList();
  }

  private void requireAdmin(String suppliedKey) {
    if (!adminKey.equals(suppliedKey)) throw new AdminForbiddenException();
  }

  @ResponseStatus(HttpStatus.NOT_FOUND)
  static class OrderNotFoundException extends RuntimeException { }

  @ResponseStatus(HttpStatus.UNAUTHORIZED)
  static class AdminForbiddenException extends RuntimeException { }

  record CreateOrderRequest(@NotBlank String customerName, @Email @NotBlank String email, @NotEmpty List<@Valid OrderItem> items) { }
  record OrderItem(@NotBlank String productId, @NotBlank String name, @Min(1) int quantity, @Min(0) BigDecimal unitPrice) { }
  record OrderResponse(String id, String status, String customerName, String email, List<OrderItem> items, BigDecimal total, Instant createdAt) { }
}
