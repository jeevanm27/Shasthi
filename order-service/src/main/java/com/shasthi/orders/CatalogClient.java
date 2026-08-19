package com.shasthi.orders;

import java.math.BigDecimal;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
class CatalogClient {
  private final RestClient catalog;
  CatalogClient(RestClient catalogRestClient) { this.catalog = catalogRestClient; }
  CatalogProduct find(String id) {
    return catalog.get().uri("/api/products/{id}", id).retrieve()
        .onStatus(HttpStatusCode::isError, (_request, _response) -> { throw new ProductUnavailableException(); })
        .body(CatalogProduct.class);
  }
  record CatalogProduct(String id, String name, BigDecimal price, boolean available) { }
  static class ProductUnavailableException extends RuntimeException { }
}
