const express = require('express');
const router = express.Router();
const PayrollService = require('../services/payroll.service');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createPayrunSchema } = require('../schemas/payroll.schema');

const payrollAccess = rbac(['admin', 'payroll_officer'], 'payroll');

// GET /api/payroll/dashboard
router.get('/dashboard', authenticate, payrollAccess, async (req, res) => {
  try {
    const data = await PayrollService.getDashboard(req.user.company_id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/payroll/payruns
router.post('/payruns', authenticate, payrollAccess, validate(createPayrunSchema), async (req, res) => {
  try {
    const payrun = await PayrollService.createPayrun(req.user.company_id, req.user.id, req.validatedBody);
    res.status(201).json({ success: true, data: payrun });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/payroll/payruns
router.get('/payruns', authenticate, payrollAccess, async (req, res) => {
  try {
    const payruns = await PayrollService.listPayruns(req.user.company_id);
    res.json({ success: true, data: payruns });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/payroll/payruns/:id
router.get('/payruns/:id', authenticate, payrollAccess, async (req, res) => {
  try {
    const data = await PayrollService.getPayrun(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/payroll/payruns/:id/compute
router.post('/payruns/:id/compute', authenticate, payrollAccess, async (req, res) => {
  try {
    const payslips = await PayrollService.computePayrun(req.params.id);
    res.json({ success: true, data: payslips });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/payroll/payruns/:id/validate
router.put('/payruns/:id/validate', authenticate, payrollAccess, async (req, res) => {
  try {
    const payrun = await PayrollService.validatePayrun(req.params.id);
    res.json({ success: true, data: payrun });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/payroll/payruns/:id/cancel
router.put('/payruns/:id/cancel', authenticate, payrollAccess, async (req, res) => {
  try {
    const payrun = await PayrollService.cancelPayrun(req.params.id);
    res.json({ success: true, data: payrun });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/payroll/payslips/:id
router.get('/payslips/:id', authenticate, payrollAccess, async (req, res) => {
  try {
    const payslip = await PayrollService.getPayslip(req.params.id);
    res.json({ success: true, data: payslip });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/payroll/payslips/:id/cancel
router.put('/payslips/:id/cancel', authenticate, payrollAccess, async (req, res) => {
  try {
    const payslip = await PayrollService.cancelPayslip(req.params.id);
    res.json({ success: true, data: payslip });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/payroll/payslips/:id/new
router.post('/payslips/:id/new', authenticate, payrollAccess, async (req, res) => {
  try {
    const payslip = await PayrollService.recomputePayslip(req.params.id);
    res.json({ success: true, data: payslip });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
