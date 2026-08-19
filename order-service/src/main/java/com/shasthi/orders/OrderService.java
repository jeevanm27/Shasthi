package com.shasthi.orders;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
class OrderService {
  private final JdbcTemplate jdbc; private final CatalogClient catalog;
  OrderService(JdbcTemplate jdbc, CatalogClient catalog) { this.jdbc = jdbc; this.catalog = catalog; }
  @Transactional OrderController.OrderResponse create(OrderController.CreateOrderRequest request) {
    List<OrderController.OrderLine> lines = request.items().stream().map(item -> {
      CatalogClient.CatalogProduct product = catalog.find(item.productId());
      if (!product.available()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more products are unavailable");
      return new OrderController.OrderLine(product.id(), product.name(), item.quantity(), product.price());
    }).toList();
    BigDecimal total = lines.stream().map(line -> line.unitPrice().multiply(BigDecimal.valueOf(line.quantity()))).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    String id = UUID.randomUUID().toString(); Instant createdAt = Instant.now();
    jdbc.update("INSERT INTO customer_orders (id, status, customer_name, email, total, created_at) VALUES (?, 'CONFIRMED', ?, ?, ?, ?)", id, request.customerName(), request.email(), total, createdAt);
    for (OrderController.OrderLine line : lines) jdbc.update("INSERT INTO order_items (order_id, product_id, name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)", id, line.productId(), line.name(), line.quantity(), line.unitPrice());
    return new OrderController.OrderResponse(id, "CONFIRMED", request.customerName(), request.email(), lines, total, createdAt);
  }
  List<OrderController.OrderResponse> list() { return jdbc.query("SELECT id, status, customer_name, email, total, created_at FROM customer_orders ORDER BY created_at DESC", orderMapper()); }
  OrderController.OrderResponse get(String id) { List<OrderController.OrderResponse> orders = jdbc.query("SELECT id, status, customer_name, email, total, created_at FROM customer_orders WHERE id = ?", orderMapper(), id); if (orders.isEmpty()) throw new OrderController.OrderNotFoundException(); return orders.getFirst(); }
  private RowMapper<OrderController.OrderResponse> orderMapper() { return (rs, _row) -> new OrderController.OrderResponse(rs.getString("id"), rs.getString("status"), rs.getString("customer_name"), rs.getString("email"), items(rs.getString("id")), rs.getBigDecimal("total"), rs.getTimestamp("created_at").toInstant()); }
  private List<OrderController.OrderLine> items(String orderId) { return jdbc.query("SELECT product_id, name, quantity, unit_price FROM order_items WHERE order_id = ?", (rs, _row) -> new OrderController.OrderLine(rs.getString("product_id"), rs.getString("name"), rs.getInt("quantity"), rs.getBigDecimal("unit_price")), orderId); }
}
