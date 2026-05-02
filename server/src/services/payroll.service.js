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
        missingBankAccount: missingBank,
        missingManager: missingManager,
      },
      payruns: payruns.slice(0, 5), // latest 5
      employerCost: { monthly: employerCost },
      employeeCount: { monthly: employeeCount },
    };
  },

  async createPayrun(companyId, userId, { name, periodStart, periodEnd }) {
    return PayrollModel.createPayrun({ companyId, name, periodStart, periodEnd, createdBy: userId });
  },

  async listPayruns(companyId) {
    return PayrollModel.findPayrunsByCompany(companyId);
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
      const stdAllowance = round(full.components.standardAllowance * ratio);
      const perfBonus = round(full.components.performanceBonus * ratio);
      const lta = round(full.components.leaveTravel * ratio);
      const fixedAllow = round(full.components.fixedAllowance * ratio);
      const grossWage = round(basicAmount + hraAmount + stdAllowance + perfBonus + lta + fixedAllow);
      const pfEmployee = round(basicAmount * (parseFloat(salary.pf_rate) / 100));
      const pfEmployer = round(basicAmount * (parseFloat(salary.pf_rate) / 100));
      const profTax = round(parseFloat(salary.professional_tax));
      const totalDeductions = round(pfEmployee + profTax);
      const netWage = round(grossWage - totalDeductions);

      const payslip = await PayrollModel.createPayslip({
        payrunId, employeeId: emp.id, periodStart, periodEnd,
        totalWorkingDays, attendanceDays, paidLeaveDays, unpaidLeaveDays, payableDays,
        basicAmount, hraAmount, standardAllowance: stdAllowance,
        performanceBonus: perfBonus, leaveTravel: lta, fixedAllowance: fixedAllow,
        grossWage, pfEmployee, pfEmployer, professionalTax: profTax,
        totalDeductions, netWage, employerCost: parseFloat(salary.monthly_wage),
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
};

module.exports = PayrollService;
