import { api } from './client.js';

export const catalogApi = {
  // Customer: list products (paginated)
  getProducts: (page = 1, size = 20) =>
    api.get(`/api/catalog/products?page=${page}&size=${size}`),

  // Customer: instant Redis search
  searchProducts: (q) =>
    api.get(`/api/catalog/products/search?q=${encodeURIComponent(q)}`),

  // Public: single product
  getProduct: (id) =>
    api.get(`/api/catalog/products/${id}`),

  // Admin: create product
  createProduct: (product) =>
    api.post('/api/catalog/products', product),

  // Admin: update product
  updateProduct: (id, product) =>
    api.put(`/api/catalog/products/${id}`, product),

  // Admin: delete product
  deleteProduct: (id) =>
    api.delete(`/api/catalog/products/${id}`),
};
