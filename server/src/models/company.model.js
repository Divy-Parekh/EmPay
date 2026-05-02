const { query } = require('../config/db');

const CompanyModel = {
  async create({ name, logo_url, prefix, created_by }) {
    const result = await query(
      `INSERT INTO companies (name, logo_url, prefix, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, logo_url, prefix, created_by]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query('SELECT * FROM companies WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { name, logo_url }) {
    const result = await query(
      `UPDATE companies SET name = COALESCE($2, name), logo_url = COALESCE($3, logo_url), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, name, logo_url]
    );
    return result.rows[0];
  },
};

module.exports = CompanyModel;
