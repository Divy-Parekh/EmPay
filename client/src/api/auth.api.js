import { api } from './client';

export const authApi = {
  signup: (data) => api.upload('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};
