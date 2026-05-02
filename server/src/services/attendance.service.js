const AttendanceModel = require('../models/attendance.model');
const EmployeeModel = require('../models/employee.model');

const AttendanceService = {
  async checkIn(userId) {
    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    const existingActive = await AttendanceModel.findActiveSession(employee.id);
    if (existingActive) {
      throw Object.assign(new Error('Already checked in'), { status: 400, code: 'VALIDATION_ERROR' });
    }

    return AttendanceModel.checkIn(employee.id);
  },

  async checkOut(userId) {
    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    const record = await AttendanceModel.checkOut(employee.id);
    if (!record) {
      throw Object.assign(new Error('No active check-in found for today'), { status: 400, code: 'VALIDATION_ERROR' });
    }
    return record;
  },

  async getMyAttendance(userId, month, year) {
    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    const records = await AttendanceModel.findByEmployeeAndMonth(employee.id, month, year);
    const summary = await AttendanceModel.getMonthSummary(employee.id, month, year);

    // Get leave balance for context
    const TimeOffModel = require('../models/timeoff.model');
    const balances = await TimeOffModel.getBalances(employee.id, year);
    const totalLeaveRemaining = balances.reduce((sum, b) => sum + (parseFloat(b.total_allocated) - parseFloat(b.used)), 0);

    return {
      records,
      summary: {
        days_present: parseInt(summary.days_present) || 0,
        leaves_remaining: totalLeaveRemaining,
        total_working_days: parseInt(employee.working_days) || 22,
        total_work_hours: parseFloat(summary.total_work_hours) || 0,
      },
    };
  },

  async getAllAttendance(companyId, date) {
    return AttendanceModel.findAllByDate(companyId, date);
  },

  async getStatus(userId) {
    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) return { is_checked_in: false };

    const sessions = await AttendanceModel.findTodayByEmployee(employee.id);
    const activeSession = sessions.find(s => !s.check_out);
    
    // Sum up work hours for today
    const totalTodayHours = sessions.reduce((sum, s) => sum + (parseFloat(s.work_hours) || 0), 0);

    return {
      is_checked_in: !!activeSession,
      check_in: activeSession?.check_in || (sessions.length > 0 ? sessions[0].check_in : null),
      check_out: activeSession ? null : (sessions.length > 0 ? sessions[0].check_out : null),
      work_hours: totalTodayHours,
      sessions_count: sessions.length
    };
  },

  async getEmployeeStatuses(companyId) {
    const today = new Date().toISOString().split('T')[0];
    return AttendanceModel.getStatusForEmployees(companyId, today);
  },
};

module.exports = AttendanceService;
