import { api } from './client.js';

export const ordersApi = {
  // Customer: their own orders (GET /api/orders/my)
  getMyOrders: () =>
    api.get('/api/orders/my'),

  // Admin: all orders in the system
  getAllOrders: () =>
    api.get('/api/orders'),

  // Admin: update fulfillment status
  updateOrderStatus: (id, status) =>
    api.put(`/api/orders/${id}/status`, { status }),
};
