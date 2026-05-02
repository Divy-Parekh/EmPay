const PayrollModel = require('../models/payroll.model');
const EmployeeModel = require('../models/employee.model');
const SalaryModel = require('../models/salary.model');
const AttendanceModel = require('../models/attendance.model');
const TimeOffModel = require('../models/timeoff.model');
const { computeFullSalary, getBusinessDays, round } = require('../utils/salary');

const PayrollService = {
  async getDashboard(companyId) {
    const currentYear = new Date().getFullYear();
    const missingBank = await EmployeeModel.countMissingBankDetails(companyId);
    const missingManager = await EmployeeModel.countMissingManager(companyId);
    const payruns = await PayrollModel.findPayrunsByCompany(companyId);
    const employerCost = await PayrollModel.getEmployerCostByMonth(companyId, currentYear);
    const employeeCount = await PayrollModel.getEmployeeCountByMonth(companyId, currentYear);

    return {
      warnings: {
        missing_bank_account: missingBank,
        missing_manager: missingManager,
      },
      payruns: payruns.slice(0, 5), // latest 5
      employer_cost: { monthly: employerCost },
      employee_count: { monthly: employeeCount },
    };
  },

  async createPayrun(company_id, user_id, { name, period_start, period_end }) {
    return PayrollModel.createPayrun({ company_id, name, period_start, period_end, created_by: user_id });
  },

  async listPayruns(companyId) {
    const payruns = await PayrollModel.findPayrunsByCompany(companyId);
    // Fetch payslips for each payrun to satisfy frontend requirements
    for (const pr of payruns) {
      pr.payslips = await PayrollModel.findPayslipsByPayrun(pr.id);
    }
    return payruns;
  },

  async getPayrun(payrunId) {
    const payrun = await PayrollModel.findPayrunById(payrunId);
    if (!payrun) throw Object.assign(new Error('Payrun not found'), { status: 404 });
    const payslips = await PayrollModel.findPayslipsByPayrun(payrunId);
    return { payrun, payslips };
  },

  async computePayrun(payrunId) {
    const payrun = await PayrollModel.findPayrunById(payrunId);
    if (!payrun) throw Object.assign(new Error('Payrun not found'), { status: 404 });

    const employees = await EmployeeModel.findByCompany(payrun.company_id);
    const periodStart = payrun.period_start;
    const periodEnd = payrun.period_end;
    const totalWorkingDays = getBusinessDays(new Date(periodStart), new Date(periodEnd));

    const payslips = [];
    for (const emp of employees) {
      const salary = await SalaryModel.findByEmployee(emp.id);
      if (!salary || parseFloat(salary.monthly_wage) === 0) continue;

      const attendanceDays = await AttendanceModel.countAttendanceDays(emp.id, periodStart, periodEnd);
      const paidLeaveDays = await TimeOffModel.countPaidLeaveDays(emp.id, periodStart, periodEnd);
      const unpaidLeaveDays = await TimeOffModel.countUnpaidLeaveDays(emp.id, periodStart, periodEnd);
      const payableDays = attendanceDays + paidLeaveDays;

      const full = computeFullSalary(salary);
      const ratio = totalWorkingDays > 0 ? payableDays / totalWorkingDays : 0;

      const basicAmount = round(full.components.basic * ratio);
      const hraAmount = round(full.components.hra * ratio);
      const stdAllowance = round(full.components.standard_allowance * ratio);
      const perfBonus = round(full.components.performance_bonus * ratio);
      const lta = round(full.components.leave_travel * ratio);
      const fixedAllow = round(full.components.fixed_allowance * ratio);
      const grossWage = round(basicAmount + hraAmount + stdAllowance + perfBonus + lta + fixedAllow);
      const pfEmployee = round(basicAmount * (parseFloat(salary.pf_rate) / 100));
      const pfEmployer = round(basicAmount * (parseFloat(salary.pf_rate) / 100));
      const profTax = round(parseFloat(salary.professional_tax));
      const totalDeductions = round(pfEmployee + profTax);
      const netWage = round(grossWage - totalDeductions);

      const payslip = await PayrollModel.createPayslip({
        payrun_id: payrunId, employee_id: emp.id, period_start: periodStart, period_end: periodEnd,
        total_working_days: totalWorkingDays, attendance_days: attendanceDays,
        paid_leave_days: paidLeaveDays, unpaid_leave_days: unpaidLeaveDays, payable_days: payableDays,
        basic_amount: basicAmount, hra_amount: hraAmount, standard_allowance: stdAllowance,
        performance_bonus: perfBonus, leave_travel: lta, fixed_allowance: fixedAllow,
        gross_wage: grossWage, pf_employee: pfEmployee, pf_employer: pfEmployer, professional_tax: profTax,
        total_deductions: totalDeductions, net_wage: netWage, employer_cost: parseFloat(salary.monthly_wage),
        status: 'computed',
      });
      payslips.push(payslip);
    }

    await PayrollModel.updatePayrunStatus(payrunId, 'computed');
    return payslips;
  },

  async validatePayrun(payrunId) {
    const payrun = await PayrollModel.findPayrunById(payrunId);
    if (!payrun) throw Object.assign(new Error('Payrun not found'), { status: 404 });

    // Validate all payslips in this payrun
    const payslips = await PayrollModel.findPayslipsByPayrun(payrunId);
    for (const ps of payslips) {
      if (ps.status === 'computed') {
        await PayrollModel.updatePayslipStatus(ps.id, 'validated');
      }
    }
    return PayrollModel.updatePayrunStatus(payrunId, 'validated');
  },

  async cancelPayrun(payrunId) {
    const payslips = await PayrollModel.findPayslipsByPayrun(payrunId);
    for (const ps of payslips) {
      await PayrollModel.updatePayslipStatus(ps.id, 'cancelled');
    }
    return PayrollModel.updatePayrunStatus(payrunId, 'cancelled');
  },

  async getPayslip(payslipId) {
    const payslip = await PayrollModel.findPayslipById(payslipId);
    if (!payslip) throw Object.assign(new Error('Payslip not found'), { status: 404 });
    return payslip;
  },

  async cancelPayslip(payslipId) {
    return PayrollModel.updatePayslipStatus(payslipId, 'cancelled');
  },

  async recomputePayslip(payslipId) {
    const payslip = await PayrollModel.findPayslipById(payslipId);
    if (!payslip) throw Object.assign(new Error('Payslip not found'), { status: 404 });

    const payrun = await PayrollModel.findPayrunById(payslip.payrun_id);
    const salary = await SalaryModel.findByEmployee(payslip.employee_id);
    if (!salary) throw Object.assign(new Error('Salary structure not found'), { status: 400 });

    const periodStart = payrun.period_start;
    const periodEnd = payrun.period_end;
    const totalWorkingDays = getBusinessDays(new Date(periodStart), new Date(periodEnd));

    const attendanceDays = await AttendanceModel.countAttendanceDays(payslip.employee_id, periodStart, periodEnd);
    const paidLeaveDays = await TimeOffModel.countPaidLeaveDays(payslip.employee_id, periodStart, periodEnd);
    const unpaidLeaveDays = await TimeOffModel.countUnpaidLeaveDays(payslip.employee_id, periodStart, periodEnd);
    const payableDays = attendanceDays + paidLeaveDays;

    const full = computeFullSalary(salary);
    const ratio = totalWorkingDays > 0 ? payableDays / totalWorkingDays : 0;

    const basicAmount = round(full.components.basic * ratio);
    const hraAmount = round(full.components.hra * ratio);
    const stdAllowance = round(full.components.standard_allowance * ratio);
    const perfBonus = round(full.components.performance_bonus * ratio);
    const lta = round(full.components.leave_travel * ratio);
    const fixedAllow = round(full.components.fixed_allowance * ratio);
    const grossWage = round(basicAmount + hraAmount + stdAllowance + perfBonus + lta + fixedAllow);
    const pfEmployee = round(basicAmount * (parseFloat(salary.pf_rate) / 100));
    const pfEmployer = round(basicAmount * (parseFloat(salary.pf_rate) / 100));
    const profTax = round(parseFloat(salary.professional_tax));
    const totalDeductions = round(pfEmployee + profTax);
    const netWage = round(grossWage - totalDeductions);

    return PayrollModel.createPayslip({
      payrun_id: payslip.payrun_id, employee_id: payslip.employee_id, period_start: periodStart, period_end: periodEnd,
      total_working_days: totalWorkingDays, attendance_days: attendanceDays,
      paid_leave_days: paidLeaveDays, unpaid_leave_days: unpaidLeaveDays, payable_days: payableDays,
      basic_amount: basicAmount, hra_amount: hraAmount, standard_allowance: stdAllowance,
      performance_bonus: perfBonus, leave_travel: lta, fixed_allowance: fixedAllow,
      gross_wage: grossWage, pf_employee: pfEmployee, pf_employer: pfEmployer, professional_tax: profTax,
      total_deductions: totalDeductions, net_wage: netWage, employer_cost: parseFloat(salary.monthly_wage),
      status: 'computed',
    });
  },
};

module.exports = PayrollService;
