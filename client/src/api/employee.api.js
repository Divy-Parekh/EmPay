import { api } from './client';

export const employeeApi = {
  list: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  updateResume: (id, data) => api.put(`/employees/${id}/resume`, data),
  updatePrivateInfo: (id, data) => api.put(`/employees/${id}/private-info`, data),
  getStatus: (id) => api.get(`/employees/${id}/status`),

  /* Skills */
  addSkill: (id, data) => api.post(`/employees/${id}/skills`, data),
  removeSkill: (id, skillId) => api.delete(`/employees/${id}/skills/${skillId}`),

  /* Certifications */
  addCertification: (id, data) => api.post(`/employees/${id}/certifications`, data),
  removeCertification: (id, certId) => api.delete(`/employees/${id}/certifications/${certId}`),

  /* Salary */
  getSalary: (id) => api.get(`/employees/${id}/salary`),
  updateSalary: (id, data) => api.put(`/employees/${id}/salary`, data),
};
