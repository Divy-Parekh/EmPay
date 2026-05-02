const PayrollModel = require('../models/payroll.model');
const EmployeeModel = require('../models/employee.model');
const SalaryModel = require('../models/salary.model');
const CompanyModel = require('../models/company.model');
const { computeFullSalary } = require('../utils/salary');

const ReportsService = {
  async getSalaryStatement(employeeId, year) {
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    const company = await CompanyModel.findById(employee.company_id);
    const salary = await SalaryModel.findByEmployee(employeeId);
    if (!salary) throw Object.assign(new Error('Salary structure not configured'), { status: 400 });

    const fullSalary = computeFullSalary(salary);
    const payslips = await PayrollModel.findPayslipsByEmployee(employeeId, year);

    // Aggregate from actual payslips if available
    let monthlyAmounts = fullSalary;
    if (payslips.length > 0) {
      // Use average of actual payslips
      const totalMonths = payslips.length;
      monthlyAmounts = {
        components: {
          basic: payslips.reduce((s, p) => s + parseFloat(p.basic_amount), 0) / totalMonths,
          hra: payslips.reduce((s, p) => s + parseFloat(p.hra_amount), 0) / totalMonths,
          standardAllowance: payslips.reduce((s, p) => s + parseFloat(p.standard_allowance), 0) / totalMonths,
          performanceBonus: payslips.reduce((s, p) => s + parseFloat(p.performance_bonus), 0) / totalMonths,
          leaveTravel: payslips.reduce((s, p) => s + parseFloat(p.leave_travel), 0) / totalMonths,
          fixedAllowance: payslips.reduce((s, p) => s + parseFloat(p.fixed_allowance), 0) / totalMonths,
        },
        deductions: {
          pfEmployee: payslips.reduce((s, p) => s + parseFloat(p.pf_employee), 0) / totalMonths,
          pfEmployer: payslips.reduce((s, p) => s + parseFloat(p.pf_employer), 0) / totalMonths,
          professionalTax: payslips.reduce((s, p) => s + parseFloat(p.professional_tax), 0) / totalMonths,
        },
        grossWage: payslips.reduce((s, p) => s + parseFloat(p.gross_wage), 0) / totalMonths,
        netWage: payslips.reduce((s, p) => s + parseFloat(p.net_wage), 0) / totalMonths,
      };
    }

    const round = (n) => Math.round(n * 100) / 100;

    return {
      employee: {
        name: `${employee.first_name} ${employee.last_name}`,
        designation: employee.job_position || 'N/A',
        dateOfJoining: employee.date_of_joining,
        salaryEffectiveFrom: salary.created_at,
        empCode: employee.emp_code,
        department: employee.department,
        location: employee.location,
        panNumber: employee.pan_number,
        uanNumber: employee.uan_number,
        bankAccNumber: employee.bank_acc_number,
      },
      company: { name: company.name, logoUrl: company.logo_url },
      components: [
        { name: 'Basic Salary', monthlyAmount: round(monthlyAmounts.components.basic), yearlyAmount: round(monthlyAmounts.components.basic * 12) },
        { name: 'House Rent Allowance', monthlyAmount: round(monthlyAmounts.components.hra), yearlyAmount: round(monthlyAmounts.components.hra * 12) },
        { name: 'Standard Allowance', monthlyAmount: round(monthlyAmounts.components.standardAllowance), yearlyAmount: round(monthlyAmounts.components.standardAllowance * 12) },
        { name: 'Performance Bonus', monthlyAmount: round(monthlyAmounts.components.performanceBonus), yearlyAmount: round(monthlyAmounts.components.performanceBonus * 12) },
        { name: 'Leave Travel Allowance', monthlyAmount: round(monthlyAmounts.components.leaveTravel), yearlyAmount: round(monthlyAmounts.components.leaveTravel * 12) },
        { name: 'Fixed Allowance', monthlyAmount: round(monthlyAmounts.components.fixedAllowance), yearlyAmount: round(monthlyAmounts.components.fixedAllowance * 12) },
      ],
      deductions: [
        { name: 'PF Employee', monthlyAmount: round(monthlyAmounts.deductions.pfEmployee), yearlyAmount: round(monthlyAmounts.deductions.pfEmployee * 12) },
        { name: 'PF Employer', monthlyAmount: round(monthlyAmounts.deductions.pfEmployer), yearlyAmount: round(monthlyAmounts.deductions.pfEmployer * 12) },
        { name: 'Professional Tax', monthlyAmount: round(monthlyAmounts.deductions.professionalTax), yearlyAmount: round(monthlyAmounts.deductions.professionalTax * 12) },
        { name: 'TDS Deduction', monthlyAmount: 0, yearlyAmount: 0 },
      ],
      grossSalary: { monthly: round(monthlyAmounts.grossWage), yearly: round(monthlyAmounts.grossWage * 12) },
      netSalary: { monthly: round(monthlyAmounts.netWage), yearly: round(monthlyAmounts.netWage * 12) },
    };
  },
};

module.exports = ReportsService;
