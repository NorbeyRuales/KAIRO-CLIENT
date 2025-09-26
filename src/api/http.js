const ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const BASE_URL = ORIGIN + '/api/v1';

if (import.meta.env?.DEV) console.log('🔧 BASE_URL =', BASE_URL);

async function request(path, { method = 'GET', headers = {}, body } = {}) {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}${safePath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJSON = res.headers.get('content-type')?.includes('application/json');
  const payload = isJSON ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const msg = payload?.message || payload?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

export const http = {
  get: (path, opts) => request(path, { method: 'GET', ...opts }),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts) => request(path, { method: 'PUT', body, ...opts }),
  del: (path, opts) => request(path, { method: 'DELETE', ...opts }),
};
