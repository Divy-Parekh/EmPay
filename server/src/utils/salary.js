/**
 * Salary Computation Engine
 * Computes salary components, deductions, gross, and net wage.
 * Supports pro-rata calculation based on attendance.
 */

/**
 * Compute full monthly salary breakdown from salary structure.
 * @param {object} structure - Salary structure from DB
 * @returns {object} Computed salary components
 */
function computeFullSalary(structure) {
  const wage = parseFloat(structure.monthly_wage);
  const basic = wage * (parseFloat(structure.basic_pct) / 100);
  const hra = basic * (parseFloat(structure.hra_pct) / 100);
  const standardAllowance = parseFloat(structure.standard_allowance);
  const performanceBonus = basic * (parseFloat(structure.performance_bonus_pct) / 100);
  const leaveTravel = basic * (parseFloat(structure.leave_travel_pct) / 100);
  const fixedAllowance = wage - (basic + hra + standardAllowance + performanceBonus + leaveTravel);

  const pfEmployee = basic * (parseFloat(structure.pf_rate) / 100);
  const pfEmployer = basic * (parseFloat(structure.pf_rate) / 100);
  const professionalTax = parseFloat(structure.professional_tax);

  const gross = basic + hra + standardAllowance + performanceBonus + leaveTravel + fixedAllowance;
  const totalDeductions = pfEmployee + professionalTax;
  const net = gross - totalDeductions;

  return {
    components: {
      basic: round(basic),
      hra: round(hra),
      standardAllowance: round(standardAllowance),
      performanceBonus: round(performanceBonus),
      leaveTravel: round(leaveTravel),
      fixedAllowance: round(fixedAllowance),
    },
    deductions: {
      pfEmployee: round(pfEmployee),
      pfEmployer: round(pfEmployer),
      professionalTax: round(professionalTax),
    },
    grossWage: round(gross),
    totalDeductions: round(totalDeductions),
    netWage: round(net),
    employerCost: round(wage),
    yearlyWage: round(wage * 12),
  };
}

/**
 * Compute pro-rata salary based on attendance for a pay period.
 * @param {object} structure - Salary structure from DB
 * @param {number} payableDays - Days worked + paid leaves
 * @param {number} totalWorkingDays - Total business days in the period
 * @returns {object} Pro-rated salary breakdown
 */
function computeProRataSalary(structure, payableDays, totalWorkingDays) {
  const full = computeFullSalary(structure);
  const ratio = totalWorkingDays > 0 ? payableDays / totalWorkingDays : 0;

  return {
    components: {
      basic: round(full.components.basic * ratio),
      hra: round(full.components.hra * ratio),
      standardAllowance: round(full.components.standardAllowance * ratio),
      performanceBonus: round(full.components.performanceBonus * ratio),
      leaveTravel: round(full.components.leaveTravel * ratio),
      fixedAllowance: round(full.components.fixedAllowance * ratio),
    },
    deductions: {
      pfEmployee: round(full.deductions.pfEmployee * ratio),
      pfEmployer: round(full.deductions.pfEmployer * ratio),
      professionalTax: round(full.deductions.professionalTax), // Professional tax is flat
    },
    grossWage: round(Object.values(full.components).reduce((a, b) => a + b, 0) * ratio),
    totalDeductions: round((full.deductions.pfEmployee * ratio) + full.deductions.professionalTax),
    netWage: 0, // calculated below
    employerCost: round(full.employerCost),
  };
}

/**
 * Calculate total business days (Mon-Fri) in a date range.
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {number}
 */
function getBusinessDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function round(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

module.exports = { computeFullSalary, computeProRataSalary, getBusinessDays, round };
