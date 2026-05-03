const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  // Ensure we get the latest token from localStorage
  const token = localStorage.getItem('empay_token');
  
  const headers = {
    // Default to JSON if not FormData
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    // Auth header
    ...(token && { 'Authorization': `Bearer ${token}` }),
    // Required for ngrok free tier
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized — ONLY if it's not the initial health check or something minor
    if (res.status === 401) {
      console.warn('Unauthorized request to:', endpoint);
      
      // If we're already on login, don't redirect again
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('empay_token');
        localStorage.removeItem('empay_user');
        window.location.href = '/login?session=expired';
      }
      
      return { 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Session expired' } 
      };
    }

    // Try to parse JSON, if it fails, return raw text or empty
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    
    return { success: res.ok };
  } catch (err) {
    console.error('API Error:', err);
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
      headers: {}, // fetch will set boundary for FormData automatically
    }),
};
