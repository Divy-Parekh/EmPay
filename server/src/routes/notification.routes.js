const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const NotificationService = require('../services/notification.service');

router.use(authenticate);

// Get user notifications
router.get('/', async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const data = await NotificationService.getUserNotifications(req.user.id, limit, offset);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.put('/read-all', async (req, res, next) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// Mark single as read
router.put('/:id/read', async (req, res, next) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
    if (!notification) {
      return res.status(404).json({ success: false, error: { message: 'Notification not found' } });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
