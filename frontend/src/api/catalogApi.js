const BASE = import.meta.env.VITE_CATALOG_API || '/catalog';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Catalog error ${res.status}`);
  return data;
}

export const catalogApi = {
  getProducts: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.q)        qs.set('q', params.q);
    const query = qs.toString();
    return request(`/api/products${query ? `?${query}` : ''}`);
  },

  getProduct: (id) => request(`/api/products/${id}`),

  createProduct: (adminKey, body) =>
    request('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
      body: JSON.stringify(body),
    }),

  updateProduct: (adminKey, id, body) =>
    request(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
      body: JSON.stringify(body),
    }),

  deleteProduct: (adminKey, id) =>
    request(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': adminKey },
    }),
};