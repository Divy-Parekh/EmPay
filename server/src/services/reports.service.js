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
          standard_allowance: payslips.reduce((s, p) => s + parseFloat(p.standard_allowance), 0) / totalMonths,
          performance_bonus: payslips.reduce((s, p) => s + parseFloat(p.performance_bonus), 0) / totalMonths,
          leave_travel: payslips.reduce((s, p) => s + parseFloat(p.leave_travel), 0) / totalMonths,
          fixed_allowance: payslips.reduce((s, p) => s + parseFloat(p.fixed_allowance), 0) / totalMonths,
        },
        deductions: {
          pf_employee: payslips.reduce((s, p) => s + parseFloat(p.pf_employee), 0) / totalMonths,
          pf_employer: payslips.reduce((s, p) => s + parseFloat(p.pf_employer), 0) / totalMonths,
          professional_tax: payslips.reduce((s, p) => s + parseFloat(p.professional_tax), 0) / totalMonths,
        },
        gross_wage: payslips.reduce((s, p) => s + parseFloat(p.gross_wage), 0) / totalMonths,
        net_wage: payslips.reduce((s, p) => s + parseFloat(p.net_wage), 0) / totalMonths,
      };
    }

    const round = (n) => Math.round(n * 100) / 100;

    return {
      employee: {
        name: `${employee.first_name} ${employee.last_name}`,
        designation: employee.job_position || 'N/A',
        date_of_joining: employee.date_of_joining,
        salary_effective_from: salary.created_at,
        emp_code: employee.emp_code,
        department: employee.department,
        location: employee.location,
        pan_number: employee.pan_number,
        uan_number: employee.uan_number,
        bank_acc_number: employee.bank_acc_number,
      },
      company: { name: company.name, logo_url: company.logo_url },
      components: [
        { name: 'Basic Salary', monthly_amount: round(monthlyAmounts.components.basic), yearly_amount: round(monthlyAmounts.components.basic * 12) },
        { name: 'House Rent Allowance', monthly_amount: round(monthlyAmounts.components.hra), yearly_amount: round(monthlyAmounts.components.hra * 12) },
        { name: 'Standard Allowance', monthly_amount: round(monthlyAmounts.components.standard_allowance), yearly_amount: round(monthlyAmounts.components.standard_allowance * 12) },
        { name: 'Performance Bonus', monthly_amount: round(monthlyAmounts.components.performance_bonus), yearly_amount: round(monthlyAmounts.components.performance_bonus * 12) },
        { name: 'Leave Travel Allowance', monthly_amount: round(monthlyAmounts.components.leave_travel), yearly_amount: round(monthlyAmounts.components.leave_travel * 12) },
        { name: 'Fixed Allowance', monthly_amount: round(monthlyAmounts.components.fixed_allowance), yearly_amount: round(monthlyAmounts.components.fixed_allowance * 12) },
      ],
      deductions: [
        { name: 'PF Employee', monthly_amount: round(monthlyAmounts.deductions.pf_employee), yearly_amount: round(monthlyAmounts.deductions.pf_employee * 12) },
        { name: 'PF Employer', monthly_amount: round(monthlyAmounts.deductions.pf_employer), yearly_amount: round(monthlyAmounts.deductions.pf_employer * 12) },
        { name: 'Professional Tax', monthly_amount: round(monthlyAmounts.deductions.professional_tax), yearly_amount: round(monthlyAmounts.deductions.professional_tax * 12) },
        { name: 'TDS Deduction', monthly_amount: 0, yearly_amount: 0 },
      ],
      gross_salary: { monthly: round(monthlyAmounts.gross_wage), yearly: round(monthlyAmounts.gross_wage * 12) },
      net_salary: { monthly: round(monthlyAmounts.net_wage), yearly: round(monthlyAmounts.net_wage * 12) },
    };
  },
};

module.exports = ReportsService;
