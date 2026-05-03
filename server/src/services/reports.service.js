const PayrollModel = require('../models/payroll.model');
const EmployeeModel = require('../models/employee.model');
const SalaryModel = require('../models/salary.model');
const CompanyModel = require('../models/company.model');
const AttendanceModel = require('../models/attendance.model');
const { query } = require('../config/db');
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
      type: 'salary_statement',
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

  async getAttendanceSummary(employeeId, year) {
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    const result = await query(
      `SELECT 
         EXTRACT(MONTH FROM date) as month,
         COUNT(*) as total_sessions,
         SUM(work_hours) as total_hours,
         COUNT(DISTINCT date) as days_present
       FROM attendance
       WHERE employee_id = $1 AND EXTRACT(YEAR FROM date) = $2
       GROUP BY month ORDER BY month ASC`,
      [employeeId, year]
    );

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months = result.rows.map(r => ({
      month: monthNames[parseInt(r.month) - 1],
      days_present: parseInt(r.days_present),
      total_hours: parseFloat(r.total_hours || 0).toFixed(2),
      avg_hours: (parseFloat(r.total_hours || 0) / parseInt(r.days_present)).toFixed(2)
    }));

    return {
      type: 'attendance_summary',
      employee: { name: `${employee.first_name} ${employee.last_name}`, emp_code: employee.emp_code },
      year,
      months,
      total_days: months.reduce((s, m) => s + m.days_present, 0),
      total_hours: months.reduce((s, m) => s + parseFloat(m.total_hours), 0).toFixed(2)
    };
  },

  async getLeaveHistory(employeeId, year) {
    const employee = await EmployeeModel.findById(employeeId);
    const result = await query(
      `SELECT tr.*, tt.name as leave_type
       FROM time_off_requests tr
       JOIN time_off_types tt ON tr.time_off_type_id = tt.id
       WHERE tr.employee_id = $1 
         AND (EXTRACT(YEAR FROM tr.start_date) = $2 OR EXTRACT(YEAR FROM tr.end_date) = $2)
       ORDER BY tr.start_date DESC`,
      [employeeId, year]
    );

    return {
      type: 'leave_history',
      employee: { name: `${employee.first_name} ${employee.last_name}` },
      year,
      requests: result.rows
    };
  },

  async getPayrollSummary(companyId, year) {
    const result = await query(
      `SELECT 
         EXTRACT(MONTH FROM ps.period_start) as month, 
         COUNT(*) as employees_paid,
         SUM(ps.gross_wage) as total_gross,
         SUM(ps.net_wage) as total_net,
         SUM(ps.pf_employer + ps.pf_employee) as total_pf
       FROM payslips ps
       JOIN payruns p ON ps.payrun_id = p.id
       WHERE p.company_id = $1 
         AND EXTRACT(YEAR FROM ps.period_start) = $2
         AND ps.status != 'cancelled'
       GROUP BY month ORDER BY month ASC`,
      [companyId, year]
    );

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = result.rows.map(r => ({
      ...r,
      month: monthNames[parseInt(r.month) - 1]
    }));

    return {
      type: 'payroll_summary',
      year,
      data
    };
  },

  async getHeadcountGrowth(companyId) {
    const result = await query(
      `SELECT 
         EXTRACT(YEAR FROM date_of_joining) as year,
         COUNT(*) as hires
       FROM employees
       WHERE company_id = $1
       GROUP BY year ORDER BY year ASC`,
      [companyId]
    );

    let cumulative = 0;
    const growth = result.rows.map(r => {
      cumulative += parseInt(r.hires);
      return { year: r.year, hires: parseInt(r.hires), total: cumulative };
    });

    return {
      type: 'headcount_growth',
      growth
    };
  },

  async getTaxReport(companyId, year) {
    const result = await query(
      `SELECT 
         EXTRACT(MONTH FROM ps.period_start) as month,
         SUM(ps.pf_employee) as total_pf_employee,
         SUM(ps.pf_employer) as total_pf_employer,
         SUM(ps.professional_tax) as total_pt
       FROM payslips ps
       JOIN payruns p ON ps.payrun_id = p.id
       WHERE p.company_id = $1 
         AND EXTRACT(YEAR FROM ps.period_start) = $2
         AND ps.status != 'cancelled'
       GROUP BY month ORDER BY month ASC`,
      [companyId, year]
    );

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = result.rows.map(r => ({
      ...r,
      month: monthNames[parseInt(r.month) - 1]
    }));

    return {
      type: 'tax_report',
      year,
      data
    };
  },

  async getLeaveApprovals(companyId, year) {
    const result = await query(
      `SELECT 
         tr.*, 
         tt.name as leave_type,
         e.first_name, e.last_name, e.emp_code
       FROM time_off_requests tr
       JOIN time_off_types tt ON tr.time_off_type_id = tt.id
       JOIN employees e ON tr.employee_id = e.id
       WHERE e.company_id = $1 
         AND (EXTRACT(YEAR FROM tr.start_date) = $2 OR EXTRACT(YEAR FROM tr.end_date) = $2)
       ORDER BY tr.created_at DESC`,
      [companyId, year]
    );

    return {
      type: 'leave_approvals',
      year,
      requests: result.rows
    };
  },

  async getEmployeeProfile(employeeId) {
    const result = await query(
      `SELECT e.*, u.role, c.name as company_name, m.first_name as m_first, m.last_name as m_last
       FROM employees e
       JOIN users u ON u.id = e.user_id
       JOIN companies c ON c.id = e.company_id
       LEFT JOIN employees m ON m.id = e.manager_id
       WHERE e.id = $1`,
      [employeeId]
    );

    if (result.rows.length === 0) throw { status: 404, message: 'Employee not found' };

    return {
      type: 'employee_profile',
      employee: result.rows[0]
    };
  },

  async getAttritionReport(companyId, year) {
    const result = await query(
      `SELECT 
         EXTRACT(MONTH FROM u.updated_at) as month,
         COUNT(*) as count
       FROM users u
       JOIN employees e ON u.id = e.user_id
       WHERE e.company_id = $1 AND u.is_active = FALSE 
         AND EXTRACT(YEAR FROM u.updated_at) = $2
       GROUP BY month ORDER BY month ASC`,
      [companyId, year]
    );

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = result.rows.map(r => ({
      ...r,
      month: monthNames[parseInt(r.month) - 1]
    }));

    return {
      type: 'attrition_report',
      year,
      data
    };
  }
};

module.exports = ReportsService;

