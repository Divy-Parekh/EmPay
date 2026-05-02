const AttendanceModel = require('../models/attendance.model');
const EmployeeModel = require('../models/employee.model');

const AttendanceService = {
  async checkIn(userId) {
    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    const existing = await AttendanceModel.findTodayByEmployee(employee.id);
    if (existing && existing.check_in && !existing.check_out) {
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
        daysPresent: parseInt(summary.days_present) || 0,
        leavesRemaining: totalLeaveRemaining,
        totalWorkingDays: parseInt(employee.working_days) || 22,
        totalWorkHours: parseFloat(summary.total_work_hours) || 0,
      },
    };
  },

  async getAllAttendance(companyId, date) {
    return AttendanceModel.findAllByDate(companyId, date);
  },

  async getStatus(userId) {
    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) return { isCheckedIn: false };

    const today = await AttendanceModel.findTodayByEmployee(employee.id);
    return {
      isCheckedIn: today ? (today.check_in && !today.check_out) : false,
      checkIn: today?.check_in || null,
      checkOut: today?.check_out || null,
      workHours: today?.work_hours || 0,
    };
  },

  async getEmployeeStatuses(companyId) {
    const today = new Date().toISOString().split('T')[0];
    return AttendanceModel.getStatusForEmployees(companyId, today);
  },
};

module.exports = AttendanceService;
