const TimeOffModel = require('../models/timeoff.model');
const EmployeeModel = require('../models/employee.model');

const TimeOffService = {
  async getTypes(companyId) {
    return TimeOffModel.getTypes(companyId);
  },

  async getBalances(userId, companyId, role) {
    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    const year = new Date().getFullYear();
    return TimeOffModel.getBalances(employee.id, year);
  },

  async createRequest(userId, { timeOffTypeId, startDate, endDate, allocationDays, attachmentUrl, note }) {
    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    // Validate balance
    const year = new Date(startDate).getFullYear();
    const balances = await TimeOffModel.getBalances(employee.id, year);
    const typeBalance = balances.find(b => b.time_off_type_id === timeOffTypeId);

    if (typeBalance) {
      const remaining = parseFloat(typeBalance.total_allocated) - parseFloat(typeBalance.used);
      if (allocationDays > remaining) {
        throw Object.assign(new Error(`Insufficient leave balance. Available: ${remaining} days`), { status: 400, code: 'VALIDATION_ERROR' });
      }
    }

    return TimeOffModel.createRequest({
      employeeId: employee.id, timeOffTypeId, startDate, endDate, allocationDays, attachmentUrl, note,
    });
  },

  async getRequests(userId, companyId, role) {
    if (['admin', 'hr_officer', 'payroll_officer'].includes(role)) {
      return TimeOffModel.findRequestsByCompany(companyId);
    }
    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) return [];
    return TimeOffModel.findRequestsByEmployee(employee.id);
  },

  async approveRequest(requestId, approvedById) {
    const request = await TimeOffModel.findRequestById(requestId);
    if (!request) throw Object.assign(new Error('Request not found'), { status: 404 });
    if (request.status !== 'pending') throw Object.assign(new Error('Request is not pending'), { status: 400 });

    const updated = await TimeOffModel.updateRequestStatus(requestId, 'approved', approvedById);

    // Update used days in balance
    const year = new Date(request.start_date).getFullYear();
    await TimeOffModel.updateUsedDays(request.employee_id, request.time_off_type_id, year, parseFloat(request.allocation_days));

    return updated;
  },

  async rejectRequest(requestId, rejectedById) {
    const request = await TimeOffModel.findRequestById(requestId);
    if (!request) throw Object.assign(new Error('Request not found'), { status: 404 });
    if (request.status !== 'pending') throw Object.assign(new Error('Request is not pending'), { status: 400 });

    return TimeOffModel.updateRequestStatus(requestId, 'rejected', rejectedById);
  },

  async allocateLeave(companyId, { employeeId, timeOffTypeId, days, year }) {
    const currentYear = year || new Date().getFullYear();
    return TimeOffModel.upsertBalance({
      employeeId, timeOffTypeId, totalAllocated: days, year: currentYear,
    });
  },

  async initializeDefaultTypes(companyId) {
    const defaults = [
      { name: 'Paid Time Off', isPaid: true, defaultDays: 24 },
      { name: 'Sick Leave', isPaid: true, defaultDays: 7 },
      { name: 'Unpaid Leave', isPaid: false, defaultDays: 0 },
    ];
    for (const d of defaults) {
      await TimeOffModel.createType({ companyId, ...d });
    }
  },
};

module.exports = TimeOffService;
