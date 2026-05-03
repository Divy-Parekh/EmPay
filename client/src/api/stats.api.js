import { api } from './client';

export const statsApi = {
  getEmployeeStats: () => api.get('/stats/employees'),
  getAttendanceStats: () => api.get('/stats/attendance'),
  getTimeOffStats: () => api.get('/stats/time-off'),
  getPayrollStats: () => api.get('/stats/payroll')
};
