const StatsService = require('../services/stats.service');

const StatsController = {
  async getEmployeeStats(req, res) {
    try {
      const stats = await StatsService.getEmployeeStats(req.user.company_id);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  },

  async getAttendanceStats(req, res) {
    try {
      const stats = await StatsService.getAttendanceStats(req.user.company_id);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  },

  async getTimeOffStats(req, res) {
    try {
      const stats = await StatsService.getTimeOffStats(req.user.company_id);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  },

  async getPayrollStats(req, res) {
    try {
      const stats = await StatsService.getPayrollStats(req.user.company_id);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
};

module.exports = StatsController;
