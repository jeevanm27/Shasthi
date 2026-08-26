const BASE = import.meta.env.VITE_INSIGHTS_API || '/insights';

export const insightsApi = {
  getCartInsight: async (items) => {
    const res = await fetch(`${BASE}/api/insights/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map(({ category, quantity }) => ({ category, quantity })) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Insights unavailable');
    return data;
  },
};