package com.shasthi.orders;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {
  private final OrderService orderService;
  private final String adminKey;
  OrderController(OrderService orderService, @Value("${ADMIN_KEY:shasthi-admin}") String adminKey) { this.orderService = orderService; this.adminKey = adminKey; }
  @PostMapping @ResponseStatus(HttpStatus.CREATED)
  OrderResponse create(@Valid @RequestBody CreateOrderRequest request) { return orderService.create(request); }
  @GetMapping
  List<OrderResponse> list(@RequestHeader(value = "X-Admin-Key", required = false) String suppliedKey) { requireAdmin(suppliedKey); return orderService.list(); }
  @GetMapping("/{id}")
  OrderResponse get(@PathVariable String id, @RequestHeader(value = "X-Admin-Key", required = false) String suppliedKey) { requireAdmin(suppliedKey); return orderService.get(id); }
  private void requireAdmin(String suppliedKey) { if (!adminKey.equals(suppliedKey)) throw new AdminForbiddenException(); }
  @ExceptionHandler(CatalogClient.ProductUnavailableException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  ErrorResponse unavailableProduct() { return new ErrorResponse("One or more products are unavailable"); }
  @ResponseStatus(HttpStatus.UNAUTHORIZED) static class AdminForbiddenException extends RuntimeException { }
  @ResponseStatus(HttpStatus.NOT_FOUND) static class OrderNotFoundException extends RuntimeException { }
  record CreateOrderRequest(@NotBlank String customerName, @Email @NotBlank String email, @NotEmpty @Size(max = 20) List<@Valid OrderItem> items) { }
  record OrderItem(@NotBlank String productId, @Min(1) int quantity) { }
  record OrderLine(String productId, String name, int quantity, BigDecimal unitPrice) { }
  record OrderResponse(String id, String status, String customerName, String email, List<OrderLine> items, BigDecimal total, Instant createdAt) { }
  record ErrorResponse(String message) { }
}
