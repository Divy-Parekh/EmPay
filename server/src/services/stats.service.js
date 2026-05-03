const { query } = require('../config/db');

const StatsService = {
  async getEmployeeStats(companyId) {
    // 1. Department Distribution
    const deptResult = await query(
      `SELECT COALESCE(department, 'Unassigned') as name, COUNT(*) as value
       FROM employees
       WHERE company_id = $1
       GROUP BY department`,
      [companyId]
    );

    // 2. Headcount Growth (Last 6 months)
    const growthResult = await query(
      `SELECT 
         TO_CHAR(date_of_joining, 'Mon YYYY') as month,
         COUNT(*) as count,
         MIN(date_of_joining) as sort_date
       FROM employees
       WHERE company_id = $1
       GROUP BY month
       ORDER BY sort_date ASC
       LIMIT 6`,
      [companyId]
    );

    return {
      departmentDistribution: deptResult.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
      headcountGrowth: growthResult.rows.map(r => ({ name: r.month, count: parseInt(r.count) }))
    };
  },

  async getAttendanceStats(companyId) {
    // Get total active employees for this company
    const headCountRes = await query(
      'SELECT COUNT(*) as count FROM employees WHERE company_id = $1',
      [companyId]
    );
    const totalEmployees = parseInt(headCountRes.rows[0].count);

    // 1. Daily Status for last 7 days
    const statusResult = await query(
      `SELECT 
         date,
         TO_CHAR(date, 'DD Mon') as name,
         COUNT(DISTINCT employee_id) FILTER (WHERE status = 'present' OR (check_in IS NOT NULL)) as present,
         COUNT(DISTINCT employee_id) FILTER (WHERE status = 'on_leave') as on_leave
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE e.company_id = $1 AND a.date > CURRENT_DATE - INTERVAL '7 days'
       GROUP BY date, name
       ORDER BY date ASC`,
      [companyId]
    );

    // 2. Average Work Hours last 7 days
    const hoursResult = await query(
      `SELECT 
         date,
         TO_CHAR(date, 'DD Mon') as name,
         AVG(work_hours) as hours
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE e.company_id = $1 AND a.date > CURRENT_DATE - INTERVAL '7 days' AND work_hours > 0
       GROUP BY date, name
       ORDER BY date ASC`,
      [companyId]
    );

    return {
      attendanceTrends: statusResult.rows.map(r => {
        const present = parseInt(r.present);
        const onLeave = parseInt(r.on_leave);
        // Absentees = Total - Present - OnLeave
        // We use Math.max(0, ...) to prevent negative numbers if data is slightly inconsistent
        const absent = Math.max(0, totalEmployees - present - onLeave);
        
        return {
          name: r.name,
          present: present,
          absent: absent,
          on_leave: onLeave
        };
      }),
      workHoursTrend: hoursResult.rows.map(r => ({
        name: r.name,
        hours: parseFloat(parseFloat(r.hours).toFixed(1))
      }))
    };
  },

  async getTimeOffStats(companyId) {
    // 1. Leave Type Breakdown
    const typeResult = await query(
      `SELECT tot.name, COUNT(*) as value
       FROM time_off_requests tor
       JOIN time_off_types tot ON tot.id = tor.time_off_type_id
       WHERE tot.company_id = $1 AND tor.status = 'approved'
       GROUP BY tot.name`,
      [companyId]
    );

    // 2. Approval Status Counts
    const statusResult = await query(
      `SELECT status as name, COUNT(*) as value
       FROM time_off_requests tor
       JOIN employees e ON e.id = tor.employee_id
       WHERE e.company_id = $1
       GROUP BY status`,
      [companyId]
    );

    return {
      leaveTypeDistribution: typeResult.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
      approvalStatusDistribution: statusResult.rows.map(r => ({ name: r.name, value: parseInt(r.value) }))
    };
  },

  async getPayrollStats(companyId) {
    // 1. Monthly Expense Trend (Last 6 months)
    const expenseResult = await query(
      `SELECT 
         TO_CHAR(ps.period_start, 'Mon YYYY') as month,
         SUM(ps.net_wage) as total,
         MIN(ps.period_start) as sort_date
       FROM payslips ps
       JOIN payruns p ON p.id = ps.payrun_id
       WHERE p.company_id = $1 AND ps.status != 'cancelled'
       GROUP BY month
       ORDER BY sort_date DESC
       LIMIT 6`,
      [companyId]
    );

    // 2. Department Cost Breakdown
    const deptCostResult = await query(
      `SELECT e.department as name, SUM(ps.net_wage) as value
       FROM payslips ps
       JOIN payruns p ON p.id = ps.payrun_id
       JOIN employees e ON e.id = ps.employee_id
       WHERE p.company_id = $1 AND ps.status != 'cancelled'
       GROUP BY e.department`,
      [companyId]
    );

    return {
      payrollTrend: expenseResult.rows.reverse().map(r => ({
        name: r.month,
        amount: parseFloat(r.total)
      })),
      departmentCost: deptCostResult.rows.map(r => ({
        name: r.name || 'Unassigned',
        value: parseFloat(r.value)
      }))
    };
  }
};

module.exports = StatsService;
