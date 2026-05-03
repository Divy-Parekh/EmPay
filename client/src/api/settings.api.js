import { api } from './client';

export const settingsApi = {
  getUsers: () => api.get('/settings/users'),
  updateRole: (id, role) => api.put(`/settings/users/${id}/role`, { role }),
  updateManager: (id, employee_id, manager_id) => api.put(`/settings/users/${id}/manager`, { employee_id, manager_id }),
  updatePermissions: (id, permissions) =>
    api.put(`/settings/users/${id}/permissions`, permissions),
  getCompany: () => api.get('/settings/company'),
  updateCompany: (data) => api.put('/settings/company', data),
};
