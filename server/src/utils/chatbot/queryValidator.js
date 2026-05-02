/**
 * SQL Query Validator for EmPay AI Chatbot
 * Ensures only safe, read-only queries are executed.
 */

// Patterns that are NEVER allowed in read queries
const BLOCKED_PATTERNS = [
  /\bDROP\b/i,
  /\bDELETE\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\b/i,
  /\bCREATE\b/i,
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bEXEC\b/i,
  /\bEXECUTE\b/i,
  /\bCOPY\b/i,
  /\bpg_/i,            // Block access to pg_ system tables
  /information_schema/i,
  /\bINTO\b/i,         // SELECT INTO
];

// Tables that employees can access (only their own rows)
const EMPLOYEE_ALLOWED_TABLES = [
  'employees', 'attendance', 'time_off_requests', 'time_off_balances',
  'time_off_types', 'payslips', 'employee_skills', 'employee_certifications',
  'notifications',
];

// Tables that HR officers CANNOT access
const HR_BLOCKED_TABLES = [
  'salary_structures', 'payslips', 'payruns',
];

/**
 * Validate a SQL query for safety.
 * @param {string} sql - The SQL query to validate
 * @param {string} role - The user's role
 * @param {string} companyId - The user's company ID
 * @param {string} employeeId - The user's employee ID (for employee role)
 * @returns {{ valid: boolean, error?: string, sanitizedSql?: string }}
 */
function validateQuery(sql, role, companyId, employeeId) {
  if (!sql || typeof sql !== 'string') {
    return { valid: false, error: 'Empty or invalid query' };
  }

  const trimmed = sql.trim();

  // Must start with SELECT
  if (!/^\s*SELECT\b/i.test(trimmed)) {
    return { valid: false, error: 'Only SELECT queries are allowed' };
  }

  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: `Query contains blocked operation: ${pattern.source}` };
    }
  }

  // Check for multiple statements (semicolons not at the end)
  const withoutEnd = trimmed.replace(/;\s*$/, '');
  if (withoutEnd.includes(';')) {
    return { valid: false, error: 'Multiple statements are not allowed' };
  }

  // Role-based table access checks
  if (role === 'hr_officer') {
    for (const table of HR_BLOCKED_TABLES) {
      const tableRegex = new RegExp(`\\b${table}\\b`, 'i');
      if (tableRegex.test(trimmed)) {
        return { valid: false, error: `HR officers cannot access the ${table} table` };
      }
    }
  }

  // Append LIMIT if not present
  let sanitizedSql = withoutEnd;
  if (!/\bLIMIT\b/i.test(sanitizedSql)) {
    sanitizedSql += ' LIMIT 50';
  }

  return { valid: true, sanitizedSql };
}

module.exports = { validateQuery };
