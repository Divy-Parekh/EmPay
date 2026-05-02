const { query } = require('../config/db');

/**
 * Role-based access control middleware.
 * Checks if the user's role is in the allowed roles list.
 * Also checks module-level permissions from user_permissions table.
 *
 * @param {string[]} allowedRoles - Array of allowed roles
 * @param {string} [module] - Optional module name for permission check
 * @returns {Function} Express middleware
 */
function rbac(allowedRoles, module) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      // Admin always has access
      if (req.user.role === 'admin') {
        return next();
      }

      // Check role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient role permissions' },
        });
      }

      // If a module is specified, check module-level permissions
      if (module) {
        const result = await query(
          `SELECT ${module} FROM user_permissions WHERE user_id = $1`,
          [req.user.id]
        );

        if (result.rows.length > 0 && !result.rows[0][module]) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: `No access to ${module} module` },
          });
        }
      }

      next();
    } catch (err) {
      console.error('RBAC middleware error:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Authorization check failed' },
      });
    }
  };
}

module.exports = { rbac };
