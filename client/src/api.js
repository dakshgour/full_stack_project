const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({ success: false, error: 'Invalid server response' }));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || payload.message || 'Request failed');
  }
  return payload.data;
}

export const api = {
  signup: (body) => request('/api/auth/signup', { method: 'POST', body }),
  verifyEmail: (body) => request('/api/auth/verify-email', { method: 'POST', body }),
  resendOtp: (body) => request('/api/auth/resend-otp', { method: 'POST', body }),
  login: (body) => request('/api/auth/login', { method: 'POST', body }),
  forgotPassword: (body) => request('/api/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body) => request('/api/auth/reset-password', { method: 'POST', body }),
  me: (token) => request('/api/auth/me', { token }),
  listCodes: (token) => request('/api/codes', { token }),
  getCode: (token, id) => request(`/api/codes/${id}`, { token }),
  createCode: (token, body) => request('/api/codes', { method: 'POST', token, body }),
  updateCode: (token, id, body) => request(`/api/codes/${id}`, { method: 'PUT', token, body }),
  deleteCode: (token, id) => request(`/api/codes/${id}`, { method: 'DELETE', token }),
  executeCode: (token, body) => request('/api/execute', { method: 'POST', token, body }),
  saveVisualization: (token, body) => request('/api/visualizations', { method: 'POST', token, body }),
  getDashboard: (token) => request('/api/progress/dashboard', { token }),
  // Public playground — no auth required
  playgroundTrace: (body) => request('/api/playground/trace', { method: 'POST', body }),
};
