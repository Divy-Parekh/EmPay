const { query } = require('../config/db');

const AttendanceModel = {
  async checkIn(employeeId) {
    // Upsert: create or update today's record. 
    // If updating, we reset check_out and hours to allow a new session on the same day.
    const result = await query(
      `INSERT INTO attendance (employee_id, date, check_in, status)
       VALUES ($1, CURRENT_DATE, NOW(), 'present')
       ON CONFLICT (employee_id, date) DO UPDATE SET 
         check_in = NOW(), 
         check_out = NULL,
         work_hours = 0,
         extra_hours = 0,
         status = 'present'
       RETURNING *`,
      [employeeId]
    );
    return result.rows[0];
  },

  async checkOut(employeeId) {
    const result = await query(
      `UPDATE attendance
       SET check_out = NOW(),
           work_hours = ROUND(EXTRACT(EPOCH FROM (NOW() - check_in)) / 3600.0, 2),
           extra_hours = GREATEST(0, ROUND(EXTRACT(EPOCH FROM (NOW() - check_in)) / 3600.0 - 8, 2))
       WHERE employee_id = $1 AND date = CURRENT_DATE AND check_out IS NULL
       RETURNING *`,
      [employeeId]
    );
    return result.rows[0];
  },

  async findTodayByEmployee(employeeId) {
    const result = await query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE',
      [employeeId]
    );
    return result.rows[0];
  },

  async findByEmployeeAndDate(employeeId, date) {
    const result = await query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, date]
    );
    return result.rows[0];
  },

  async findByEmployeeAndMonth(employeeId, month, year) {
    const result = await query(
      `SELECT * FROM attendance
       WHERE employee_id = $1
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR FROM date) = $3
       ORDER BY date ASC`,
      [employeeId, month, year]
    );
    return result.rows;
  },

  async findAllByDate(companyId, date) {
    const result = await query(
      `SELECT a.*, e.first_name, e.last_name, e.profile_picture
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE e.company_id = $1 AND a.date = $2
       ORDER BY e.first_name ASC`,
      [companyId, date]
    );
    return result.rows;
  },

  async getMonthSummary(employeeId, month, year) {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'present' OR status = 'half_day') as days_present,
         COUNT(*) FILTER (WHERE status = 'on_leave') as days_on_leave,
         COALESCE(SUM(work_hours), 0) as total_work_hours
       FROM attendance
       WHERE employee_id = $1
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR FROM date) = $3`,
      [employeeId, month, year]
    );
    return result.rows[0];
  },

  async countAttendanceDays(employeeId, periodStart, periodEnd) {
    const result = await query(
      `SELECT COUNT(*) as count FROM attendance
       WHERE employee_id = $1
         AND date >= $2 AND date <= $3
         AND status IN ('present', 'half_day')`,
      [employeeId, periodStart, periodEnd]
    );
    return parseInt(result.rows[0].count);
  },

  async getStatusForEmployees(companyId, date) {
    // Returns attendance status for all employees on a given date
    const result = await query(
      `SELECT e.id as employee_id,
              CASE
                WHEN a.status = 'present' AND a.check_out IS NULL THEN 'checked_in'
                WHEN a.status = 'present' THEN 'checked_out'
                WHEN a.status = 'on_leave' THEN 'on_leave'
                ELSE 'absent'
              END as attendance_status
       FROM employees e
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = $2
       WHERE e.company_id = $1`,
      [companyId, date]
    );
    return result.rows;
  },
};

module.exports = AttendanceModel;
