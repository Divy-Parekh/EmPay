const UserModel = require('../models/user.model');
const PermissionModel = require('../models/permission.model');
const CompanyModel = require('../models/company.model');

const SettingsService = {
  async listUsers(companyId) {
    return UserModel.findByCompany(companyId);
  },

  async updateUserRole(userId, role) {
    const user = await UserModel.updateRole(userId, role);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

    // Update permissions to match new role
    const existing = await PermissionModel.findByUser(userId);
    if (existing) {
      const permMap = {
        admin:           { employees: true, attendance: true, time_off: true, payroll: true, reports: true, settings: true, company: true },
        employee:        { employees: true, attendance: true, time_off: true, payroll: false, reports: false, settings: false, company: false },
        hr_officer:      { employees: true, attendance: true, time_off: true, payroll: false, reports: false, settings: false, company: false },
        payroll_officer: { employees: true, attendance: true, time_off: true, payroll: true, reports: true, settings: false, company: false },
      };
      await PermissionModel.update(userId, permMap[role] || permMap.employee);
    } else {
      await PermissionModel.createForRole(userId, role);
    }

    return user;
  },

  async updateUserPermissions(userId, permissions) {
    const existing = await PermissionModel.findByUser(userId);
    if (existing) {
      return PermissionModel.update(userId, permissions);
    }
    return PermissionModel.create(userId, permissions);
  },

  async getCompany(companyId) {
    return CompanyModel.findById(companyId);
  },

  async updateUserManager(employeeId, managerId) {
    const EmployeeModel = require('../models/employee.model');
    const updated = await EmployeeModel.update(employeeId, { manager_id: managerId === 'none' ? null : managerId });
    return updated;
  },

  async updateCompany(companyId, data) {
    return CompanyModel.update(companyId, data);
  },
};

module.exports = SettingsService;
