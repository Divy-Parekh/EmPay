import { api } from './client';

export const timeoffApi = {
  getTypes: () => api.get('/time-off/types'),
  getBalances: (params) => api.get(`/time-off/balances?${new URLSearchParams(params || {})}`),
  getAllBalances: () => api.get('/time-off/all-balances'),
  getRequests: (params) => api.get(`/time-off/requests?${new URLSearchParams(params || {})}`),
  createRequest: (data) => api.post('/time-off/requests', data),
  uploadRequest: (formData) => api.upload('/time-off/requests', formData),
  approveRequest: (id) => api.put(`/time-off/requests/${id}/approve`),
  rejectRequest: (id) => api.put(`/time-off/requests/${id}/reject`),
  allocate: (data) => api.post('/time-off/allocate', data),
};
