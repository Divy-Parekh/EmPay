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

  async createRequest(userId, { time_off_type_id, start_date, end_date, allocation_days, attachment_url, note }) {
    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    // Validate balance
    const year = new Date(start_date).getFullYear();
    const balances = await TimeOffModel.getBalances(employee.id, year);
    const typeBalance = balances.find(b => b.time_off_type_id === time_off_type_id);

    if (typeBalance) {
      const remaining = parseFloat(typeBalance.total_allocated) - parseFloat(typeBalance.used);
      if (allocation_days > remaining) {
        throw Object.assign(new Error(`Insufficient leave balance. Available: ${remaining} days`), { status: 400, code: 'VALIDATION_ERROR' });
      }
    }

    return TimeOffModel.createRequest({
      employee_id: employee.id,
      time_off_type_id: time_off_type_id,
      start_date: start_date,
      end_date: end_date,
      allocation_days: allocation_days,
      attachment_url: attachment_url,
      note,
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

  async allocateLeave(companyId, { employee_id, time_off_type_id, days, year }) {
    const currentYear = year || new Date().getFullYear();
    return TimeOffModel.upsertBalance({
      employee_id,
      time_off_type_id,
      total_allocated: days,
      year: currentYear,
    });
  },

  async initializeDefaultTypes(companyId) {
    const defaults = [
      { name: 'Paid Time Off', is_paid: true, default_days: 24 },
      { name: 'Sick Leave', is_paid: true, default_days: 7 },
      { name: 'Unpaid Leave', is_paid: false, default_days: 0 },
    ];
    for (const d of defaults) {
      await TimeOffModel.createType({ company_id: companyId, ...d });
    }
  },
};

module.exports = TimeOffService;
