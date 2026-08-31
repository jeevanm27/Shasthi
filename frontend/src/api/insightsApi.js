// Cart insights — now served by catalog-service (Node.js) at /catalog/api/insights/
const BASE = import.meta.env.VITE_CATALOG_API || '/catalog';

export const insightsApi = {
  getCartInsight: async (items) => {
    const res = await fetch(`${BASE}/api/insights/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error('Insights unavailable');
    return res.json();
  },
};