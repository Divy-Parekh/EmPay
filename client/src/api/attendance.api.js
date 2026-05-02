import { api } from './client';

export const attendanceApi = {
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.put('/attendance/check-out'),
  getMy: (params) => api.get(`/attendance/my?${new URLSearchParams(params)}`),
  getAll: (params) => api.get(`/attendance/all?${new URLSearchParams(params)}`),
  getSummary: (params) => api.get(`/attendance/summary?${new URLSearchParams(params)}`),
};
