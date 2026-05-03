import { api } from './client';

export const notificationApi = {
  getNotifications: (limit = 50, offset = 0) => api.get(`/notifications?limit=${limit}&offset=${offset}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put(`/notifications/read-all`),
};
