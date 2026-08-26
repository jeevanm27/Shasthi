const BASE = import.meta.env.VITE_ORDER_API || '/orders';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Order error ${res.status}`);
  return data;
}

export const orderApi = {
  createOrder: (body) =>
    request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  listOrders: (adminKey) =>
    request('/api/orders', {
      headers: { 'X-Admin-Key': adminKey },
    }),

  getOrder: (adminKey, id) =>
    request(`/api/orders/${id}`, {
      headers: { 'X-Admin-Key': adminKey },
    }),
};