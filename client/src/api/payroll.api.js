import { api } from './client';

export const payrollApi = {
  getDashboard: () => api.get('/payroll/dashboard'),
  createPayrun: (data) => api.post('/payroll/payruns', data),
  getPayruns: () => api.get('/payroll/payruns'),
  getPayrun: (id) => api.get(`/payroll/payruns/${id}`),
  computePayrun: (id) => api.post(`/payroll/payruns/${id}/compute`),
  validatePayrun: (id) => api.put(`/payroll/payruns/${id}/validate`),
  cancelPayrun: (id) => api.put(`/payroll/payruns/${id}/cancel`),
  getPayslip: (id) => api.get(`/payroll/payslips/${id}`),
  newPayslip: (id) => api.post(`/payroll/payslips/${id}/new`),
  cancelPayslip: (id) => api.put(`/payroll/payslips/${id}/cancel`),
};
