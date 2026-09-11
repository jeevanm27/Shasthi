/**
 * Thin HTTP client wrapping fetch.
 * All requests go to /api/* which NGINX routes to the correct microservice.
 */

function getToken() {
  return localStorage.getItem('shasthi_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, url, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get:    (url)         => request('GET',    url),
  post:   (url, body)   => request('POST',   url, body),
  put:    (url, body)   => request('PUT',    url, body),
  delete: (url)         => request('DELETE', url),

  // Admin key header variant for registration
  postAdmin: (url, body, adminKey) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify(body),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { const e = new Error(data.message || `HTTP ${res.status}`); e.status = res.status; throw e; }
      return data;
    }),
};
