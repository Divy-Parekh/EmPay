import { api } from './client';

export const reportsApi = {
  getSalaryStatement: (employeeId, year) =>
    api.get(`/reports/salary-statement?employeeId=${employeeId}&year=${year}`),
};
