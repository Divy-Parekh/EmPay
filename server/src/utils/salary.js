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
  const standard_allowance = parseFloat(structure.standard_allowance);
  const performance_bonus = basic * (parseFloat(structure.performance_bonus_pct) / 100);
  const leave_travel = basic * (parseFloat(structure.leave_travel_pct) / 100);
  const fixed_allowance = wage - (basic + hra + standard_allowance + performance_bonus + leave_travel);

  const pf_employee = basic * (parseFloat(structure.pf_rate) / 100);
  const pf_employer = basic * (parseFloat(structure.pf_rate) / 100);
  const professional_tax = parseFloat(structure.professional_tax);

  const gross = basic + hra + standard_allowance + performance_bonus + leave_travel + fixed_allowance;
  const total_deductions = pf_employee + professional_tax;
  const net = gross - total_deductions;

  return {
    components: {
      basic: round(basic),
      hra: round(hra),
      standard_allowance: round(standard_allowance),
      performance_bonus: round(performance_bonus),
      leave_travel: round(leave_travel),
      fixed_allowance: round(fixed_allowance),
    },
    deductions: {
      pf_employee: round(pf_employee),
      pf_employer: round(pf_employer),
      professional_tax: round(professional_tax),
    },
    gross_wage: round(gross),
    total_deductions: round(total_deductions),
    net_wage: round(net),
    employer_cost: round(wage),
    yearly_wage: round(wage * 12),
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
      standard_allowance: round(full.components.standard_allowance * ratio),
      performance_bonus: round(full.components.performance_bonus * ratio),
      leave_travel: round(full.components.leave_travel * ratio),
      fixed_allowance: round(full.components.fixed_allowance * ratio),
    },
    deductions: {
      pf_employee: round(full.deductions.pf_employee * ratio),
      pf_employer: round(full.deductions.pf_employer * ratio),
      professional_tax: round(full.deductions.professional_tax), // Professional tax is flat
    },
    gross_wage: round(Object.values(full.components).reduce((a, b) => a + b, 0) * ratio),
    total_deductions: round((full.deductions.pf_employee * ratio) + full.deductions.professional_tax),
    net_wage: 0, // calculated below
    employer_cost: round(full.employer_cost),
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
