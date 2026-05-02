export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  HR_OFFICER: 'hr_officer',
  PAYROLL_OFFICER: 'payroll_officer',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  employee: 'Employee',
  hr_officer: 'HR Officer',
  payroll_officer: 'Payroll Officer',
};

export const ROLE_COLORS = {
  admin: 'badge-danger',
  employee: 'badge-info',
  hr_officer: 'badge-success',
  payroll_officer: 'badge-warning',
};

/* Check if role can access a particular module */
export function canAccess(role, module) {
  const matrix = {
    admin: ['employees', 'attendance', 'time_off', 'payroll', 'reports', 'settings', 'company', 'salary_info'],
    employee: ['attendance', 'time_off'],
    hr_officer: ['employees', 'attendance', 'time_off'],
    payroll_officer: ['employees', 'attendance', 'time_off', 'payroll', 'reports', 'salary_info'],
  };
  return matrix[role]?.includes(module) || false;
}

/* Check if role can edit employees */
export function canEditEmployee(role) {
  return ['admin', 'hr_officer'].includes(role);
}

/* Check if role can manage payroll */
export function canManagePayroll(role) {
  return ['admin', 'payroll_officer'].includes(role);
}

/* Check if role can approve/reject time-off */
export function canApproveTimeOff(role) {
  return ['admin', 'hr_officer', 'payroll_officer'].includes(role);
}
