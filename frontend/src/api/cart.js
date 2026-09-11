import { api } from './client.js';

export const cartApi = {
  // Get current cart
  getCart: () =>
    api.get('/api/cart'),

  // Add or replace item in cart
  addItem: (item) =>
    api.post('/api/cart/items', item),
    // item = { productId, productName, pricePerGram, quantityGrams, imageUrl }

  // Update item quantity
  updateItem: (productId, quantityGrams) =>
    api.put(`/api/cart/items/${productId}`, { quantityGrams }),

  // Remove one item
  removeItem: (productId) =>
    api.delete(`/api/cart/items/${productId}`),

  // Clear entire cart
  clearCart: () =>
    api.delete('/api/cart'),

  // Checkout: emits Kafka event, clears cart, returns { eventId, totalPrice }
  checkout: () =>
    api.post('/api/cart/checkout', {}),
};
