const { query } = require('../config/db');

/**
 * Generate a unique Login ID for an employee.
 * Format: [CompanyPrefix][FirstNameInitials][LastNameInitials][Year][Serial]
 * Example: OIJODO20260001
 *
 * @param {string} companyPrefix - First 2 letters of company name (uppercase)
 * @param {string} firstName - Employee's first name
 * @param {string} lastName - Employee's last name
 * @param {string} companyId - Company UUID
 * @param {number} [joiningYear] - Year of joining (defaults to current year)
 * @returns {Promise<string>} Generated login ID
 */
async function generateLoginId(companyPrefix, firstName, lastName, companyId, joiningYear) {
  const prefix = companyPrefix.substring(0, 2).toUpperCase();
  const fnInit = firstName.substring(0, 2).toUpperCase();
  const lnInit = lastName.substring(0, 2).toUpperCase();
  const year = joiningYear || new Date().getFullYear();

  // We want to ensure uniqueness globally. 
  // We'll start with a serial and increment until we find a free one.
  
  // First, get the count for this company to have a starting point
  const result = await query(
    `SELECT COUNT(*) as count FROM users 
     WHERE company_id = $1 
     AND EXTRACT(YEAR FROM created_at) = $2`,
    [companyId, year]
  );

  let serialNum = parseInt(result.rows[0].count) + 1;
  let loginId;
  let isUnique = false;

  while (!isUnique) {
    const serial = serialNum.toString().padStart(4, '0');
    loginId = `${prefix}${fnInit}${lnInit}${year}${serial}`;
    
    const existing = await query('SELECT id FROM users WHERE login_id = $1', [loginId]);
    if (existing.rows.length === 0) {
      isUnique = true;
    } else {
      serialNum++;
    }
  }

  return loginId;
}

module.exports = { generateLoginId };
