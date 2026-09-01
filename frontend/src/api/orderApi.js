const BASE       = import.meta.env.VITE_ORDER_API   || '/orders';
const CATALOG    = import.meta.env.VITE_CATALOG_API  || '/catalog';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Order error ${res.status}`);
  return data;
}

async function catalogRequest(path, options = {}) {
  const res = await fetch(`${CATALOG}${path}`, options);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

export const orderApi = {
  // Create a new order (public — called after payment verification)
  createOrder: (body) =>
    request('/api/orders', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }),

  // Fetch current user's orders — secure, JWT-authenticated via catalog-service proxy
  myOrders: (token) =>
    catalogRequest('/api/user/orders', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Admin only
  listOrders: (adminKey) =>
    request('/api/orders', {
      headers: { 'X-Admin-Key': adminKey },
    }),

  getOrder: (adminKey, id) =>
    request(`/api/orders/${id}`, {
      headers: { 'X-Admin-Key': adminKey },
    }),
};