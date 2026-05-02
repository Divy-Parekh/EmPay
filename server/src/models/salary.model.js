const { query } = require('../config/db');

const SalaryModel = {
  async findByEmployee(employeeId) {
    const result = await query(
      'SELECT * FROM salary_structures WHERE employee_id = $1',
      [employeeId]
    );
    return result.rows[0];
  },

  async create(employeeId) {
    const result = await query(
      'INSERT INTO salary_structures (employee_id) VALUES ($1) RETURNING *',
      [employeeId]
    );
    return result.rows[0];
  },

  async update(employeeId, fields) {
    const result = await query(
      `UPDATE salary_structures SET
        monthly_wage = COALESCE($2, monthly_wage),
        working_days = COALESCE($3, working_days),
        break_time_hrs = COALESCE($4, break_time_hrs),
        basic_pct = COALESCE($5, basic_pct),
        hra_pct = COALESCE($6, hra_pct),
        standard_allowance = COALESCE($7, standard_allowance),
        performance_bonus_pct = COALESCE($8, performance_bonus_pct),
        leave_travel_pct = COALESCE($9, leave_travel_pct),
        pf_rate = COALESCE($10, pf_rate),
        professional_tax = COALESCE($11, professional_tax),
        updated_at = NOW()
       WHERE employee_id = $1 RETURNING *`,
      [employeeId, fields.monthly_wage, fields.working_days, fields.break_time_hrs,
       fields.basic_pct, fields.hra_pct, fields.standard_allowance,
       fields.performance_bonus_pct, fields.leave_travel_pct,
       fields.pf_rate, fields.professional_tax]
    );
    return result.rows[0];
  },
};

module.exports = SalaryModel;
