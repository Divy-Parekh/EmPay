const { query } = require('../config/db');

const PayrollModel = {
  // --- Payruns ---
  async createPayrun({ company_id, name, period_start, period_end, created_by }) {
    const result = await query(
      `INSERT INTO payruns (company_id, name, period_start, period_end, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [company_id, name, period_start, period_end, created_by]
    );
    return result.rows[0];
  },

  async findPayrunsByCompany(companyId) {
    const result = await query(
      `SELECT p.*,
              COUNT(ps.id) as payslip_count,
              COALESCE(SUM(ps.employer_cost), 0) as total_employer_cost,
              COALESCE(SUM(ps.gross_wage), 0) as total_gross,
              COALESCE(SUM(ps.net_wage), 0) as total_net
       FROM payruns p
       LEFT JOIN payslips ps ON ps.payrun_id = p.id AND ps.status != 'cancelled'
       WHERE p.company_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [companyId]
    );
    return result.rows;
  },

  async findPayrunById(id) {
    const result = await query('SELECT * FROM payruns WHERE id = $1', [id]);
    return result.rows[0];
  },

  async updatePayrunStatus(id, status) {
    const result = await query(
      `UPDATE payruns SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return result.rows[0];
  },

  // --- Payslips ---
  async createPayslip(data) {
    const result = await query(
      `INSERT INTO payslips (
        payrun_id, employee_id, period_start, period_end,
        total_working_days, attendance_days, paid_leave_days, unpaid_leave_days, payable_days,
        basic_amount, hra_amount, standard_allowance, performance_bonus, leave_travel, fixed_allowance,
        gross_wage, pf_employee, pf_employer, professional_tax, total_deductions, net_wage, employer_cost,
        status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      ON CONFLICT (payrun_id, employee_id) DO UPDATE SET
        total_working_days=$5, attendance_days=$6, paid_leave_days=$7, unpaid_leave_days=$8, payable_days=$9,
        basic_amount=$10, hra_amount=$11, standard_allowance=$12, performance_bonus=$13, leave_travel=$14,
        fixed_allowance=$15, gross_wage=$16, pf_employee=$17, pf_employer=$18, professional_tax=$19,
        total_deductions=$20, net_wage=$21, employer_cost=$22, status=$23, updated_at=NOW()
      RETURNING *`,
      [data.payrun_id, data.employee_id, data.period_start, data.period_end,
       data.total_working_days, data.attendance_days, data.paid_leave_days, data.unpaid_leave_days, data.payable_days,
       data.basic_amount, data.hra_amount, data.standard_allowance, data.performance_bonus, data.leave_travel,
       data.fixed_allowance, data.gross_wage, data.pf_employee, data.pf_employer, data.professional_tax,
       data.total_deductions, data.net_wage, data.employer_cost, data.status || 'computed']
    );
    return result.rows[0];
  },

  async findPayslipsByPayrun(payrunId) {
    const result = await query(
      `SELECT ps.*, (e.first_name || ' ' || e.last_name) as employee_name, e.email
       FROM payslips ps
       JOIN employees e ON e.id = ps.employee_id
       WHERE ps.payrun_id = $1
       ORDER BY e.first_name ASC`,
      [payrunId]
    );
    return result.rows;
  },

  async findPayslipById(id) {
    const result = await query(
      `SELECT ps.*, (e.first_name || ' ' || e.last_name) as employee_name, e.email, e.department, e.location,
              e.date_of_joining, e.pan_number, e.uan_number, e.bank_acc_number, e.emp_code,
              p.name as payrun_name, c.name as company_name, c.logo_url as company_logo
       FROM payslips ps
       JOIN employees e ON e.id = ps.employee_id
       JOIN payruns p ON p.id = ps.payrun_id
       JOIN companies c ON c.id = p.company_id
       WHERE ps.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async updatePayslipStatus(id, status) {
    const result = await query(
      `UPDATE payslips SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return result.rows[0];
  },

  async findPayslipsByEmployee(employeeId, year) {
    const result = await query(
      `SELECT ps.*, p.name as payrun_name
       FROM payslips ps
       JOIN payruns p ON p.id = ps.payrun_id
       WHERE ps.employee_id = $1
         AND EXTRACT(YEAR FROM ps.period_start) = $2
         AND ps.status != 'cancelled'
       ORDER BY ps.period_start ASC`,
      [employeeId, year]
    );
    return result.rows;
  },

  // --- Dashboard stats ---
  async getEmployerCostByMonth(companyId, year) {
    const result = await query(
      `SELECT TO_CHAR(ps.period_start, 'Mon YYYY') as month,
              EXTRACT(MONTH FROM ps.period_start) as month_num,
              SUM(ps.employer_cost) as total_cost
       FROM payslips ps
       JOIN payruns p ON p.id = ps.payrun_id
       WHERE p.company_id = $1
         AND EXTRACT(YEAR FROM ps.period_start) = $2
         AND ps.status != 'cancelled'
       GROUP BY month, month_num
       ORDER BY month_num`,
      [companyId, year]
    );
    return result.rows;
  },

  async getEmployeeCountByMonth(companyId, year) {
    const result = await query(
      `SELECT TO_CHAR(ps.period_start, 'Mon YYYY') as month,
              EXTRACT(MONTH FROM ps.period_start) as month_num,
              COUNT(DISTINCT ps.employee_id) as count
       FROM payslips ps
       JOIN payruns p ON p.id = ps.payrun_id
       WHERE p.company_id = $1
         AND EXTRACT(YEAR FROM ps.period_start) = $2
         AND ps.status != 'cancelled'
       GROUP BY month, month_num
       ORDER BY month_num`,
      [companyId, year]
    );
    return result.rows;
  },
};

module.exports = PayrollModel;
