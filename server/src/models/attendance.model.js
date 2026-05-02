const { query } = require('../config/db');

const AttendanceModel = {
  async checkIn(employeeId) {
    const result = await query(
      `INSERT INTO attendance (employee_id, date, check_in, status)
       VALUES ($1, (NOW() AT TIME ZONE 'Asia/Kolkata')::date, NOW(), 'present')
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
       WHERE employee_id = $1 AND check_out IS NULL
       RETURNING *`,
      [employeeId]
    );
    return result.rows[0];
  },

  async findTodayByEmployee(employeeId) {
    // Returns sessions for the current day based on IST
    const result = await query(
      `SELECT * FROM attendance 
       WHERE employee_id = $1 AND date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date 
       ORDER BY check_in DESC`,
      [employeeId]
    );
    return result.rows;
  },

  async findActiveSession(employeeId) {
    // Finds the most recent open session regardless of date
    const result = await query(
      `SELECT * FROM attendance 
       WHERE employee_id = $1 AND check_out IS NULL
       ORDER BY check_in DESC LIMIT 1`,
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
         AND EXTRACT(MONTH FROM (date AT TIME ZONE 'Asia/Kolkata')) = $2
         AND EXTRACT(YEAR FROM (date AT TIME ZONE 'Asia/Kolkata')) = $3
       ORDER BY date ASC`,
      [employeeId, month, year]
    );
    return result.rows;
  },

  async findAllByDate(companyId, date) {
    const result = await query(
      `SELECT 
         e.id as employee_id, e.first_name, e.last_name, e.profile_picture,
         MIN(a.check_in) as check_in,
         MAX(a.check_out) as check_out,
         SUM(a.work_hours) as work_hours,
         SUM(a.extra_hours) as extra_hours,
         CASE
           WHEN EXISTS (SELECT 1 FROM attendance a2 WHERE a2.employee_id = e.id AND a2.date = $2 AND a2.check_out IS NULL) THEN 'present'
           WHEN EXISTS (SELECT 1 FROM attendance a3 WHERE a3.employee_id = e.id AND a3.date = $2 AND a3.status = 'on_leave') THEN 'on_leave'
           WHEN EXISTS (SELECT 1 FROM attendance a4 WHERE a4.employee_id = e.id AND a4.date = $2) THEN 'present'
           ELSE 'absent'
         END as status
       FROM employees e
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = $2
       WHERE e.company_id = $1
       GROUP BY e.id, e.first_name, e.last_name, e.profile_picture
       ORDER BY e.first_name ASC`,
      [companyId, date]
    );
    return result.rows;
  },

  async getMonthSummary(employeeId, month, year) {
    const result = await query(
      `SELECT
         COUNT(DISTINCT date) FILTER (WHERE status = 'present' OR status = 'half_day') as days_present,
         COUNT(DISTINCT date) FILTER (WHERE status = 'on_leave') as days_on_leave,
         COALESCE(SUM(work_hours), 0) as total_work_hours
       FROM attendance
       WHERE employee_id = $1
         AND EXTRACT(MONTH FROM (date AT TIME ZONE 'Asia/Kolkata')) = $2
         AND EXTRACT(YEAR FROM (date AT TIME ZONE 'Asia/Kolkata')) = $3`,
      [employeeId, month, year]
    );
    return result.rows[0];
  },

  async countAttendanceDays(employeeId, periodStart, periodEnd) {
    const result = await query(
      `SELECT COUNT(DISTINCT date) as count FROM attendance
       WHERE employee_id = $1
         AND date >= $2 AND date <= $3
         AND status IN ('present', 'half_day')`,
      [employeeId, periodStart, periodEnd]
    );
    return parseInt(result.rows[0].count);
  },

  async getStatusForEmployees(companyId, date) {
    const result = await query(
      `SELECT e.id as employee_id,
              CASE
                WHEN EXISTS (SELECT 1 FROM attendance a2 WHERE a2.employee_id = e.id AND a2.date = $2 AND a2.check_out IS NULL) THEN 'checked_in'
                WHEN EXISTS (SELECT 1 FROM attendance a3 WHERE a3.employee_id = e.id AND a3.date = $2 AND a3.check_out IS NOT NULL) THEN 'checked_out'
                WHEN EXISTS (SELECT 1 FROM attendance a4 WHERE a4.employee_id = e.id AND a4.date = $2 AND a4.status = 'on_leave') THEN 'on_leave'
                ELSE 'absent'
              END as attendance_status
       FROM employees e
       WHERE e.company_id = $1`,
      [companyId, date]
    );
    return result.rows;
  },
};

module.exports = AttendanceModel;
