const NotificationModel = require('../models/notification.model');
const UserModel = require('../models/user.model');

const NotificationService = {
  async getUserNotifications(userId, limit = 50, offset = 0) {
    const notifications = await NotificationModel.findByUserId(userId, limit, offset);
    const unreadCount = await NotificationModel.countUnreadByUserId(userId);
    return { notifications, unreadCount };
  },

  async markAsRead(notificationId, userId) {
    return await NotificationModel.markAsRead(notificationId, userId);
  },

  async markAllAsRead(userId) {
    return await NotificationModel.markAllAsRead(userId);
  },

  async createNotification(userId, title, message, type = 'system') {
    return await NotificationModel.create({ user_id: userId, title, message, type });
  },

  // Helpers for broadcasting

  async notifyCompanyAdminsAndHR(companyId, title, message, type = 'system') {
    const users = await UserModel.findByCompany(companyId);
    const targets = users.filter(u => ['admin', 'hr_officer'].includes(u.role) && u.is_active);
    
    const promises = targets.map(u => 
      NotificationModel.create({ user_id: u.id, title, message, type })
    );
    await Promise.all(promises);
  },

  async notifyCompanyPayrollAndAdmins(companyId, title, message, type = 'system') {
    const users = await UserModel.findByCompany(companyId);
    const targets = users.filter(u => ['admin', 'payroll_officer'].includes(u.role) && u.is_active);
    
    const promises = targets.map(u => 
      NotificationModel.create({ user_id: u.id, title, message, type })
    );
    await Promise.all(promises);
  }
};

module.exports = NotificationService;
