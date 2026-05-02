const { query } = require('../config/db');

const SkillModel = {
  async findByEmployee(employeeId) {
    const result = await query(
      'SELECT * FROM employee_skills WHERE employee_id = $1 ORDER BY created_at DESC',
      [employeeId]
    );
    return result.rows;
  },

  async create({ employeeId, name, level }) {
    const result = await query(
      'INSERT INTO employee_skills (employee_id, name, level) VALUES ($1, $2, $3) RETURNING *',
      [employeeId, name, level]
    );
    return result.rows[0];
  },

  async delete(id, employeeId) {
    const result = await query(
      'DELETE FROM employee_skills WHERE id = $1 AND employee_id = $2 RETURNING id',
      [id, employeeId]
    );
    return result.rows[0];
  },
};

const CertificationModel = {
  async findByEmployee(employeeId) {
    const result = await query(
      'SELECT * FROM employee_certifications WHERE employee_id = $1 ORDER BY created_at DESC',
      [employeeId]
    );
    return result.rows;
  },

  async create({ employeeId, name, issuer, dateObtained }) {
    const result = await query(
      'INSERT INTO employee_certifications (employee_id, name, issuer, date_obtained) VALUES ($1, $2, $3, $4) RETURNING *',
      [employeeId, name, issuer, dateObtained]
    );
    return result.rows[0];
  },

  async delete(id, employeeId) {
    const result = await query(
      'DELETE FROM employee_certifications WHERE id = $1 AND employee_id = $2 RETURNING id',
      [id, employeeId]
    );
    return result.rows[0];
  },
};

module.exports = { SkillModel, CertificationModel };
