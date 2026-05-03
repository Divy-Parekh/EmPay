import { api } from './client';

export const reportsApi = {
  getSalaryStatement: (employeeId, year) =>
    api.get(`/reports/salary-statement?employeeId=${employeeId}&year=${year}`),
  getAttendanceSummary: (employeeId, year) =>
    api.get(`/reports/attendance-summary?employeeId=${employeeId}&year=${year}`),
  getLeaveHistory: (employeeId, year) =>
    api.get(`/reports/leave-history?employeeId=${employeeId}&year=${year}`),
  getPayrollSummary: (year) =>
    api.get(`/reports/payroll-summary?year=${year}`),
  getTaxReport: (year) =>
    api.get(`/reports/tax-report?year=${year}`),
  getLeaveApprovals: (year) =>
    api.get(`/reports/leave-approvals?year=${year}`),
  getEmployeeProfile: (employeeId) =>
    api.get(`/reports/employee-profile?employeeId=${employeeId}`),
  getAttritionReport: (year) =>
    api.get(`/reports/attrition-report?year=${year}`),
  getHeadcountGrowth: () =>
    api.get('/reports/headcount-growth'),
};
