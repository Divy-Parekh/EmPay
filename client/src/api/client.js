const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('empay_token');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    /* Handle 401 — redirect to login */
    if (res.status === 401) {
      localStorage.removeItem('empay_token');
      localStorage.removeItem('empay_user');
      window.location.href = '/login';
      return { success: false, error: { message: 'Session expired' } };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Unable to connect to the server' },
    };
  }
}

export const api = {
  get: (url) => request(url),
  post: (url, data) =>
    request(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) =>
    request(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => request(url, { method: 'DELETE' }),
  upload: (url, formData) =>
    request(url, {
      method: 'POST',
      body: formData,
      headers: {},
    }),
};
