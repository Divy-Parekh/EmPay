/* Format currency in INR */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/* Format date as DD MMM YYYY */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* Format date as YYYY-MM-DD */
export function toISODate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/* Format time as HH:MM AM/PM */
export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const d = new Date(timeStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/* Format work hours as Xh Ym */
export function formatHours(hours) {
  if (!hours || hours === 0) return '0h 0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

/* Get month name */
export function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month - 1] || '';
}

/* Get day name */
export function getDayName(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'long' });
}

/* Generate initials from name */
export function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

/* Number to words (for payslip amount in words) */
export function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const intPart = Math.floor(Math.abs(num));
  return convert(intPart) + ' Rupees Only';
}

/* Compute salary components from wage and structure */
export function computeSalary(wage, structure = {}) {
  const basicPct = structure.basic_pct || structure.basicPct || 50;
  const hraPct = structure.hra_pct || structure.hraPct || 50;
  const stdAllowance = structure.standard_allowance || structure.standardAllowance || 4167;
  const perfBonusPct = structure.performance_bonus_pct || structure.performanceBonusPct || 8.33;
  const ltaPct = structure.leave_travel_pct || structure.leaveTravelPct || 8.333;
  const pfRate = structure.pf_rate || structure.pfRate || 12;
  const profTax = structure.professional_tax || structure.professionalTax || 200;

  const basic = (wage * basicPct) / 100;
  const hra = (basic * hraPct) / 100;
  const perfBonus = (basic * perfBonusPct) / 100;
  const lta = (basic * ltaPct) / 100;
  const fixedAllowance = wage - basic - hra - stdAllowance - perfBonus - lta;

  const pfEmployee = (basic * pfRate) / 100;
  const pfEmployer = (basic * pfRate) / 100;

  const gross = wage;
  const totalDeductions = pfEmployee + profTax;
  const net = gross - totalDeductions;

  return {
    components: {
      basic: { label: 'Basic Salary', pct: basicPct, amount: Math.round(basic * 100) / 100 },
      hra: { label: 'House Rent Allowance', pct: hraPct, ofBasic: true, amount: Math.round(hra * 100) / 100 },
      standardAllowance: { label: 'Standard Allowance', fixed: true, amount: stdAllowance },
      performanceBonus: { label: 'Performance Bonus', pct: perfBonusPct, ofBasic: true, amount: Math.round(perfBonus * 100) / 100 },
      leaveTravel: { label: 'Leave Travel Allowance', pct: ltaPct, ofBasic: true, amount: Math.round(lta * 100) / 100 },
      fixedAllowance: { label: 'Fixed Allowance', calculated: true, amount: Math.round(fixedAllowance * 100) / 100 },
    },
    deductions: {
      pfEmployee: { label: 'PF (Employee)', pct: pfRate, amount: Math.round(pfEmployee * 100) / 100 },
      pfEmployer: { label: 'PF (Employer)', pct: pfRate, amount: Math.round(pfEmployer * 100) / 100 },
      professionalTax: { label: 'Professional Tax', amount: profTax },
    },
    gross: Math.round(gross * 100) / 100,
    net: Math.round(net * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    employerCost: wage,
  };
}
