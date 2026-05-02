const { query } = require('../config/db');

const UserModel = {
  async create({ login_id, email, password_hash, role, company_id }) {
    const result = await query(
      `INSERT INTO users (login_id, email, password_hash, role, company_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, login_id, email, role, company_id, is_password_changed, created_at`,
      [login_id, email, password_hash, role, company_id]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      'SELECT id, login_id, email, password_hash, role, company_id, is_password_changed, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findByLoginId(loginId) {
    const result = await query(
      'SELECT * FROM users WHERE login_id = $1',
      [loginId]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async findByCompany(companyId) {
    const result = await query(
      `SELECT u.id, u.login_id, u.email, u.role, u.is_active, u.created_at,
              e.id as employee_id, e.first_name, e.last_name, e.manager_id
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE u.company_id = $1
       ORDER BY u.created_at DESC`,
      [companyId]
    );
    return result.rows;
  },

  async updatePassword(id, passwordHash) {
    const result = await query(
      `UPDATE users SET password_hash = $2, is_password_changed = TRUE, updated_at = NOW()
       WHERE id = $1 RETURNING id, login_id, email`,
      [id, passwordHash]
    );
    return result.rows[0];
  },

  async updateRole(id, role) {
    const result = await query(
      `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1 RETURNING id, login_id, email, role`,
      [id, role]
    );
    return result.rows[0];
  },

  async countByCompanyAndYear(companyId, year) {
    const result = await query(
      `SELECT COUNT(*) as count FROM users
       WHERE company_id = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
      [companyId, year]
    );
    return parseInt(result.rows[0].count);
  },
};

module.exports = UserModel;
