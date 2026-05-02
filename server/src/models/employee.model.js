const { query } = require('../config/db');

const EmployeeModel = {
  async create({ user_id, company_id, first_name, last_name, email, phone, date_of_joining }) {
    const result = await query(
      `INSERT INTO employees (user_id, company_id, first_name, last_name, email, phone, date_of_joining)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_DATE)) RETURNING *`,
      [user_id, company_id, first_name, last_name, email, phone, date_of_joining]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      `SELECT e.*, u.login_id, u.role,
              (m.first_name || ' ' || m.last_name) as manager_name,
              c.name as company_name
       FROM employees e
       JOIN users u ON u.id = e.user_id
       LEFT JOIN employees m ON m.id = e.manager_id
       JOIN companies c ON c.id = e.company_id
       WHERE e.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async findByUserId(userId) {
    const result = await query('SELECT * FROM employees WHERE user_id = $1', [userId]);
    return result.rows[0];
  },

  async findByCompany(companyId, search) {
    let sql = `
      SELECT e.id, e.first_name, e.last_name, e.email, e.phone, e.job_position,
             e.department, e.profile_picture, e.location, e.user_id,
             u.login_id, u.role,
             CASE
               WHEN a.status = 'present' AND a.check_out IS NULL THEN 'present'
               WHEN a.status = 'on_leave' THEN 'on_leave'
               ELSE 'absent'
             END as attendance_status
      FROM employees e
      JOIN users u ON u.id = e.user_id
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = CURRENT_DATE
      WHERE e.company_id = $1 AND u.is_active = TRUE
    `;
    const params = [companyId];

    if (search) {
      sql += ` AND (e.first_name ILIKE $2 OR e.last_name ILIKE $2 OR e.email ILIKE $2 OR u.login_id ILIKE $2)`;
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY e.created_at DESC';
    const result = await query(sql, params);
    return result.rows;
  },

  async update(id, fields) {
    const setClauses = [];
    const values = [id];
    let idx = 2;

    const fieldMap = {
      first_name: 'first_name', last_name: 'last_name', phone: 'phone',
      job_position: 'job_position', department: 'department',
      manager_id: 'manager_id', location: 'location', profile_picture: 'profile_picture',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (fields[key] !== undefined) {
        setClauses.push(`${col} = $${idx}`);
        values.push(fields[key]);
        idx++;
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push('updated_at = NOW()');
    const result = await query(
      `UPDATE employees SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async updateResume(id, { about, job_love, interests }) {
    const result = await query(
      `UPDATE employees SET about = COALESCE($2, about), job_love = COALESCE($3, job_love),
       interests = COALESCE($4, interests), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, about, job_love, interests]
    );
    return result.rows[0];
  },

  async updatePrivateInfo(id, fields) {
    const result = await query(
      `UPDATE employees SET
        date_of_birth = COALESCE($2, date_of_birth),
        address = COALESCE($3, address),
        nationality = COALESCE($4, nationality),
        gender = COALESCE($5, gender),
        marital_status = COALESCE($6, marital_status),
        bank_acc_number = COALESCE($7, bank_acc_number),
        bank_name = COALESCE($8, bank_name),
        ifsc_code = COALESCE($9, ifsc_code),
        pan_number = COALESCE($10, pan_number),
        uan_number = COALESCE($11, uan_number),
        emp_code = COALESCE($12, emp_code),
        updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, fields.date_of_birth, fields.address, fields.nationality, fields.gender,
       fields.marital_status, fields.bank_acc_number, fields.bank_name, fields.ifsc_code,
       fields.pan_number, fields.uan_number, fields.emp_code]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM employees WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  async countMissingBankDetails(companyId) {
    const result = await query(
      `SELECT e.id, e.first_name, e.last_name FROM employees e
       WHERE e.company_id = $1 AND (e.bank_acc_number IS NULL OR e.bank_acc_number = '')`,
      [companyId]
    );
    return result.rows;
  },

  async countMissingManager(companyId) {
    const result = await query(
      `SELECT e.id, e.first_name, e.last_name FROM employees e
       WHERE e.company_id = $1 AND e.manager_id IS NULL`,
      [companyId]
    );
    return result.rows;
  },
};

module.exports = EmployeeModel;
