package com.shasthi.catalog.controller;

import com.shasthi.catalog.model.Product;
import com.shasthi.catalog.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/catalog/products")
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    //  GET /api/catalog/products   paginated list (public) 
    @GetMapping
    public ResponseEntity<Map<String, Object>> listProducts(
            @RequestParam(defaultValue = "1")  int page,
            @RequestParam(defaultValue = "20") int size) {

        size = Math.min(size, 100); // cap at 100
        List<Product> products = service.listProducts(page, size);
        int total = service.countProducts();

        return ResponseEntity.ok(Map.of(
            "products",    products,
            "total",       total,
            "page",        page,
            "size",        size,
            "totalPages",  (int) Math.ceil((double) total / size)
        ));
    }

    //  GET /api/catalog/products/search?q=  Redis FT.SEARCH (public) 
    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam String q) {
        if (q == null || q.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.searchProducts(q.trim()));
    }

    //  GET /api/catalog/products/:id   single product (public) 
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable String id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    //  POST /api/catalog/products   create (ADMIN  enforced by JwtFilter) 
    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        Product created = service.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    //  PUT /api/catalog/products/:id   update (ADMIN) 
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable String id,
            @Valid @RequestBody Product product) {

        return service.updateProduct(id, product)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    //  DELETE /api/catalog/products/:id   delete (ADMIN) 
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteProduct(@PathVariable String id) {
        if (service.deleteProduct(id)) {
            return ResponseEntity.ok(Map.of("message", "Product deleted"));
        }
        return ResponseEntity.notFound().build();
    }
}
