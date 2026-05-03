const { query } = require('../config/db');

const PermissionModel = {
  async findByUser(userId) {
    const result = await query(
      'SELECT * FROM user_permissions WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  },

  async create(userId, permissions = {}) {
    const result = await query(
      `INSERT INTO user_permissions (user_id, employees, attendance, time_off, payroll, reports, settings, company)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId,
       permissions.employees ?? true,
       permissions.attendance ?? true,
       permissions.time_off ?? true,
       permissions.payroll ?? false,
       permissions.reports ?? false,
       permissions.settings ?? false,
       permissions.company ?? false]
    );
    return result.rows[0];
  },

  async createForRole(userId, role) {
    const permMap = {
      admin:           { employees: true, attendance: true, time_off: true, payroll: true, reports: true, settings: true, company: true },
      employee:        { employees: true, attendance: true, time_off: true, payroll: false, reports: false, settings: false, company: false },
      hr_officer:      { employees: true, attendance: true, time_off: true, payroll: false, reports: false, settings: false, company: false },
      payroll_officer: { employees: true, attendance: true, time_off: true, payroll: true, reports: true, settings: false, company: false },
    };
    return this.create(userId, permMap[role] || permMap.employee);
  },

  async update(userId, permissions) {
    const result = await query(
      `UPDATE user_permissions SET
        employees = COALESCE($2, employees),
        attendance = COALESCE($3, attendance),
        time_off = COALESCE($4, time_off),
        payroll = COALESCE($5, payroll),
        reports = COALESCE($6, reports),
        settings = COALESCE($7, settings),
        company = COALESCE($8, company),
        updated_at = NOW()
       WHERE user_id = $1 RETURNING *`,
      [userId, permissions.employees, permissions.attendance, permissions.time_off,
       permissions.payroll, permissions.reports, permissions.settings, permissions.company]
    );
    return result.rows[0];
  },
};

module.exports = PermissionModel;
