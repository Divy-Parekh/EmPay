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

  async getAllBalances(companyId) {
    const year = new Date().getFullYear();
    return TimeOffModel.findAllBalancesByCompany(companyId, year);
  },

  async createRequest(userId, { time_off_type_id, start_date, end_date, allocation_days, attachment_url, note }) {
    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    // Validate balance
    const types = await TimeOffModel.getTypes(employee.company_id);
    const selectedType = types.find(t => t.id === time_off_type_id);
    if (!selectedType) throw Object.assign(new Error('Invalid leave type'), { status: 400 });

    if (selectedType.is_paid) {
      const year = new Date(start_date).getFullYear();
      const balances = await TimeOffModel.getBalances(employee.id, year);
      const typeBalance = balances.find(b => b.time_off_type_id === time_off_type_id);

      const allocated = typeBalance ? parseFloat(typeBalance.total_allocated) : 0;
      const used = typeBalance ? parseFloat(typeBalance.used) : 0;
      const remaining = allocated - used;

      if (allocation_days > remaining) {
        throw Object.assign(new Error(`Insufficient leave balance. Available: ${remaining} days`), { status: 400, code: 'VALIDATION_ERROR' });
      }
    }
    // If unpaid, we don't check balance, as it's allowed but deducted from salary.

    const request = await TimeOffModel.createRequest({
      employee_id: employee.id,
      time_off_type_id: time_off_type_id,
      start_date: start_date,
      end_date: end_date,
      allocation_days: allocation_days,
      attachment_url: attachment_url,
      note,
    });

    const NotificationService = require('./notification.service');
    NotificationService.notifyCompanyAdminsAndHR(
      employee.company_id,
      'New Time Off Request',
      `${employee.first_name} ${employee.last_name} requested ${allocation_days} days off.`,
      'timeoff'
    ).catch(err => console.error('Notification failed:', err));

    return request;
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

    // Notify employee
    const NotificationService = require('./notification.service');
    const employee = await EmployeeModel.findById(request.employee_id);
    if (employee && employee.user_id) {
      NotificationService.createNotification(
        employee.user_id,
        'Time Off Approved',
        `Your time off request starting on ${request.start_date.toISOString().split('T')[0]} has been approved.`,
        'timeoff'
      ).catch(err => console.error('Notification failed:', err));
    }

    return updated;
  },

  async rejectRequest(requestId, rejectedById) {
    const request = await TimeOffModel.findRequestById(requestId);
    if (!request) throw Object.assign(new Error('Request not found'), { status: 404 });
    if (request.status !== 'pending') throw Object.assign(new Error('Request is not pending'), { status: 400 });

    const updated = await TimeOffModel.updateRequestStatus(requestId, 'rejected', rejectedById);

    // Notify employee
    const NotificationService = require('./notification.service');
    const employee = await EmployeeModel.findById(request.employee_id);
    if (employee && employee.user_id) {
      NotificationService.createNotification(
        employee.user_id,
        'Time Off Rejected',
        `Your time off request starting on ${request.start_date.toISOString().split('T')[0]} was rejected.`,
        'timeoff'
      ).catch(err => console.error('Notification failed:', err));
    }

    return updated;
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
