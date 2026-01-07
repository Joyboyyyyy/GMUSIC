import express from 'express';
import notificationService from '../services/notification.service.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit, unreadOnly } = req.query;
    const result = await notificationService.getNotifications(
      req.user.id,
      parseInt(limit) || 50,
      unreadOnly === 'true'
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Notification Routes] Error getting notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('[Notification Routes] Error marking as read:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Notification Routes] Error marking all as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await notificationService.deleteNotification(req.user.id, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Notification Routes] Error deleting notification:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
