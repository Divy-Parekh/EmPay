const { query } = require('../config/db');

const NotificationModel = {
  async create({ user_id, title, message, type = 'system' }) {
    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, title, message, type]
    );
    return result.rows[0];
  },

  async findByUserId(user_id, limit = 50, offset = 0) {
    const result = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [user_id, limit, offset]
    );
    return result.rows;
  },

  async countUnreadByUserId(user_id) {
    const result = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [user_id]
    );
    return parseInt(result.rows[0].count);
  },

  async markAsRead(id, user_id) {
    const result = await query(
      `UPDATE notifications SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, user_id]
    );
    return result.rows[0];
  },

  async markAllAsRead(user_id) {
    const result = await query(
      `UPDATE notifications SET is_read = true 
       WHERE user_id = $1 AND is_read = false 
       RETURNING *`,
      [user_id]
    );
    return result.rows;
  }
};

module.exports = NotificationModel;
