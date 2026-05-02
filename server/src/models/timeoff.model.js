const { query } = require('../config/db');

const TimeOffModel = {
  // --- Types ---
  async getTypes(companyId) {
    const result = await query(
      'SELECT * FROM time_off_types WHERE company_id = $1 ORDER BY name',
      [companyId]
    );
    return result.rows;
  },

  async createType({ company_id, name, is_paid, default_days }) {
    const result = await query(
      'INSERT INTO time_off_types (company_id, name, is_paid, default_days) VALUES ($1, $2, $3, $4) RETURNING *',
      [company_id, name, is_paid, default_days]
    );
    return result.rows[0];
  },

  // --- Balances ---
  async getBalances(employeeId, year) {
    const result = await query(
      `SELECT b.*, t.name as type_name, t.is_paid, (b.total_allocated - b.used) as remaining
       FROM time_off_balances b
       JOIN time_off_types t ON t.id = b.time_off_type_id
       WHERE b.employee_id = $1 AND b.year = $2`,
      [employeeId, year]
    );
    return result.rows;
  },

  async findAllBalancesByCompany(companyId, year) {
    const result = await query(
      `SELECT b.*, t.name as type_name, t.is_paid,
              (b.total_allocated - b.used) as remaining,
              (e.first_name || ' ' || e.last_name) as employee_name
       FROM time_off_balances b
       JOIN time_off_types t ON t.id = b.time_off_type_id
       JOIN employees e ON e.id = b.employee_id
       WHERE e.company_id = $1 AND b.year = $2
       ORDER BY e.first_name, t.name`,
      [companyId, year]
    );
    return result.rows;
  },

  async upsertBalance({ employee_id, time_off_type_id, total_allocated, year }) {
    const result = await query(
      `INSERT INTO time_off_balances (employee_id, time_off_type_id, total_allocated, year)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (employee_id, time_off_type_id, year)
       DO UPDATE SET total_allocated = $3
       RETURNING *`,
      [employee_id, time_off_type_id, total_allocated, year]
    );
    return result.rows[0];
  },

  async updateUsedDays(employeeId, timeOffTypeId, year, days) {
    const result = await query(
      `UPDATE time_off_balances SET used = used + $4
       WHERE employee_id = $1 AND time_off_type_id = $2 AND year = $3
       RETURNING *`,
      [employeeId, timeOffTypeId, year, days]
    );
    return result.rows[0];
  },

  async revertUsedDays(employeeId, timeOffTypeId, year, days) {
    const result = await query(
      `UPDATE time_off_balances SET used = GREATEST(0, used - $4)
       WHERE employee_id = $1 AND time_off_type_id = $2 AND year = $3
       RETURNING *`,
      [employeeId, timeOffTypeId, year, days]
    );
    return result.rows[0];
  },

  // --- Requests ---
  async createRequest({ employee_id, time_off_type_id, start_date, end_date, allocation_days, attachment_url, note }) {
    const result = await query(
      `INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, allocation_days, attachment_url, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [employee_id, time_off_type_id, start_date, end_date, allocation_days, attachment_url, note]
    );
    return result.rows[0];
  },

  async findRequestsByEmployee(employeeId) {
    const result = await query(
      `SELECT r.*, t.name as type_name, t.is_paid
       FROM time_off_requests r
       JOIN time_off_types t ON t.id = r.time_off_type_id
       WHERE r.employee_id = $1
       ORDER BY r.created_at DESC`,
      [employeeId]
    );
    return result.rows;
  },

  async findRequestsByCompany(companyId, status) {
    let sql = `
      SELECT r.*, t.name as type_name, t.is_paid,
             (e.first_name || ' ' || e.last_name) as employee_name
      FROM time_off_requests r
      JOIN time_off_types t ON t.id = r.time_off_type_id
      JOIN employees e ON e.id = r.employee_id
      WHERE e.company_id = $1
    `;
    const params = [companyId];

    if (status) {
      sql += ' AND r.status = $2';
      params.push(status);
    }

    sql += ' ORDER BY r.created_at DESC';
    const result = await query(sql, params);
    return result.rows;
  },

  async findRequestById(id) {
    const result = await query(
      `SELECT r.*, t.name as type_name, t.is_paid,
              (e.first_name || ' ' || e.last_name) as employee_name, e.company_id
       FROM time_off_requests r
       JOIN time_off_types t ON t.id = r.time_off_type_id
       JOIN employees e ON e.id = r.employee_id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async updateRequestStatus(id, status, approvedBy) {
    const result = await query(
      `UPDATE time_off_requests SET status = $2, approved_by = $3, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, status, approvedBy]
    );
    return result.rows[0];
  },

  async countPaidLeaveDays(employeeId, periodStart, periodEnd) {
    const result = await query(
      `SELECT COALESCE(SUM(r.allocation_days), 0) as count
       FROM time_off_requests r
       JOIN time_off_types t ON t.id = r.time_off_type_id
       WHERE r.employee_id = $1
         AND r.status = 'approved'
         AND t.is_paid = TRUE
         AND r.start_date >= $2 AND r.end_date <= $3`,
      [employeeId, periodStart, periodEnd]
    );
    return parseFloat(result.rows[0].count);
  },

  async countUnpaidLeaveDays(employeeId, periodStart, periodEnd) {
    const result = await query(
      `SELECT COALESCE(SUM(r.allocation_days), 0) as count
       FROM time_off_requests r
       JOIN time_off_types t ON t.id = r.time_off_type_id
       WHERE r.employee_id = $1
         AND r.status = 'approved'
         AND t.is_paid = FALSE
         AND r.start_date >= $2 AND r.end_date <= $3`,
      [employeeId, periodStart, periodEnd]
    );
    return parseFloat(result.rows[0].count);
  },
};

module.exports = TimeOffModel;
