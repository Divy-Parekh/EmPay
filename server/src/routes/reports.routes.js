const express = require('express');
const router = express.Router();
const ReportsService = require('../services/reports.service');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');

// GET /api/reports/salary-statement?employeeId=uuid&year=2025
router.get('/salary-statement', authenticate, rbac(['admin', 'payroll_officer'], 'reports'), async (req, res) => {
  try {
    const { employeeId, year } = req.query;
    const report = await ReportsService.getSalaryStatement(employeeId, parseInt(year));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/attendance-summary', authenticate, async (req, res) => {
  try {
    const { employeeId, year } = req.query;
    const targetId = employeeId || req.user.employee_id;
    const report = await ReportsService.getAttendanceSummary(targetId, parseInt(year));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/leave-history', authenticate, async (req, res) => {
  try {
    const { employeeId, year } = req.query;
    const targetId = employeeId || req.user.employee_id;
    const report = await ReportsService.getLeaveHistory(targetId, parseInt(year));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/payroll-summary', authenticate, rbac(['admin', 'payroll_officer'], 'reports'), async (req, res) => {
  try {
    const { year } = req.query;
    const report = await ReportsService.getPayrollSummary(req.user.company_id, parseInt(year));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/headcount-growth', authenticate, rbac(['admin', 'hr_officer'], 'reports'), async (req, res) => {
  try {
    const report = await ReportsService.getHeadcountGrowth(req.user.company_id);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/tax-report', authenticate, rbac(['admin', 'payroll_officer'], 'reports'), async (req, res) => {
  try {
    const { year } = req.query;
    const report = await ReportsService.getTaxReport(req.user.company_id, parseInt(year));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/leave-approvals', authenticate, rbac(['admin', 'hr_officer'], 'reports'), async (req, res) => {
  try {
    const { year } = req.query;
    const report = await ReportsService.getLeaveApprovals(req.user.company_id, parseInt(year));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/employee-profile', authenticate, rbac(['admin', 'hr_officer', 'payroll_officer'], 'reports'), async (req, res) => {
  try {
    const { employeeId } = req.query;
    const report = await ReportsService.getEmployeeProfile(employeeId);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/attrition-report', authenticate, rbac(['admin', 'hr_officer'], 'reports'), async (req, res) => {
  try {
    const { year } = req.query;
    const report = await ReportsService.getAttritionReport(req.user.company_id, parseInt(year));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
