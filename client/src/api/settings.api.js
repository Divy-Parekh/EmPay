import { api } from './client';

export const settingsApi = {
  getUsers: () => api.get('/settings/users'),
  updateRole: (id, role) => api.put(`/settings/users/${id}/role`, { role }),
  updatePermissions: (id, permissions) =>
    api.put(`/settings/users/${id}/permissions`, permissions),
  getCompany: () => api.get('/settings/company'),
  updateCompany: (data) => api.put('/settings/company', data),
};
