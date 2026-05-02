const express = require('express');
const router = express.Router();
const ReportsService = require('../services/reports.service');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');

// GET /api/reports/salary-statement?employeeId=uuid&year=2025
router.get('/salary-statement', authenticate, rbac(['admin', 'payroll_officer'], 'reports'), async (req, res) => {
  try {
    const { employeeId, year } = req.query;
    if (!employeeId || !year) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'employeeId and year are required' },
      });
    }
    const report = await ReportsService.getSalaryStatement(employeeId, parseInt(year));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
