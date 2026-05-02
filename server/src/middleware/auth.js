const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../config/db');

/**
 * JWT Authentication middleware.
 * Extracts token from Authorization header (Bearer <token>).
 * Attaches decoded user to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No token provided' },
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    // Verify user still exists and is active
    const result = await query(
      'SELECT id, login_id, email, role, company_id, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not found or deactivated' },
      });
    }

    req.user = {
      id: result.rows[0].id,
      login_id: result.rows[0].login_id,
      email: result.rows[0].email,
      role: result.rows[0].role,
      company_id: result.rows[0].company_id,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Token expired' },
      });
    }
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  }
}

/**
 * Generate a JWT token for a user.
 * @param {object} user - User object with id, role, company_id
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, companyId: user.company_id },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

module.exports = { authenticate, generateToken };
