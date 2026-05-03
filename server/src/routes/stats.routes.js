const express = require('express');
const router = express.Router();
const StatsController = require('../controllers/stats.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/employees', StatsController.getEmployeeStats);
router.get('/attendance', StatsController.getAttendanceStats);
router.get('/time-off', StatsController.getTimeOffStats);
router.get('/payroll', StatsController.getPayrollStats);

module.exports = router;
