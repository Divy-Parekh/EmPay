const express = require('express');
const router = express.Router();
const AttendanceService = require('../services/attendance.service');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');

// POST /api/attendance/check-in
router.post('/check-in', authenticate, async (req, res) => {
  try {
    const record = await AttendanceService.checkIn(req.user.id);
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { code: err.code, message: err.message } });
  }
});

// PUT /api/attendance/check-out
router.put('/check-out', authenticate, async (req, res) => {
  try {
    const record = await AttendanceService.checkOut(req.user.id);
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { code: err.code, message: err.message } });
  }
});

// GET /api/attendance/status
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = await AttendanceService.getStatus(req.user.id);
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/attendance/my?month=5&year=2026
router.get('/my', authenticate, async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const result = await AttendanceService.getMyAttendance(req.user.id, month, year);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/attendance/all?date=2026-05-02
router.get('/all', authenticate, rbac(['admin', 'hr_officer', 'payroll_officer'], 'attendance'), async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const records = await AttendanceService.getAllAttendance(req.user.company_id, date);
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/attendance/statuses  (for employee cards status indicators)
router.get('/statuses', authenticate, async (req, res) => {
  try {
    const statuses = await AttendanceService.getEmployeeStatuses(req.user.company_id);
    res.json({ success: true, data: statuses });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
