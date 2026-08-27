const BASE = import.meta.env.VITE_CATALOG_API || '/catalog';

async function request(path, options = {}) {
  const res  = await fetch(`${BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Auth error ${res.status}`);
  return data;
}

function authHeaders(token) {
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export const authApi = {
  register: (name, email, password) =>
    request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  googleAuth: (accessToken) =>
    request('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    }),

  me: (token) =>
    request('/api/auth/me', {
      headers: authHeaders(token),
    }),
};
