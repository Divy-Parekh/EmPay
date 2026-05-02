const express = require('express');
const router = express.Router();
const TimeOffService = require('../services/timeoff.service');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const { createTimeOffRequestSchema, allocateLeaveSchema } = require('../schemas/timeoff.schema');

// GET /api/time-off/types
router.get('/types', authenticate, async (req, res) => {
  try {
    const types = await TimeOffService.getTypes(req.user.companyId);
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/time-off/balances
router.get('/balances', authenticate, async (req, res) => {
  try {
    const balances = await TimeOffService.getBalances(req.user.id, req.user.companyId, req.user.role);
    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/time-off/requests
router.post('/requests', authenticate, upload.single('attachment'), validate(createTimeOffRequestSchema), async (req, res) => {
  try {
    const attachmentUrl = req.file ? `/uploads/attachments/${req.file.filename}` : null;
    const request = await TimeOffService.createRequest(req.user.id, {
      ...req.validatedBody,
      attachmentUrl,
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { code: err.code, message: err.message } });
  }
});

// GET /api/time-off/requests
router.get('/requests', authenticate, async (req, res) => {
  try {
    const requests = await TimeOffService.getRequests(req.user.id, req.user.companyId, req.user.role);
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/time-off/requests/:id/approve
router.put('/requests/:id/approve', authenticate, rbac(['admin', 'hr_officer', 'payroll_officer'], 'time_off'), async (req, res) => {
  try {
    const result = await TimeOffService.approveRequest(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/time-off/requests/:id/reject
router.put('/requests/:id/reject', authenticate, rbac(['admin', 'hr_officer', 'payroll_officer'], 'time_off'), async (req, res) => {
  try {
    const result = await TimeOffService.rejectRequest(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/time-off/allocate
router.post('/allocate', authenticate, rbac(['admin', 'hr_officer'], 'time_off'), validate(allocateLeaveSchema), async (req, res) => {
  try {
    const result = await TimeOffService.allocateLeave(req.user.companyId, req.validatedBody);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
