import db from '../lib/db.js';

class NotificationService {
  async createNotification(userId, title, message, type, actionUrl = null, metadata = null) {
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        actionUrl,
        metadata,
      },
    });

    return notification;
  }

  async getNotifications(userId, limit = 50, unreadOnly = false) {
    const where = { userId };
    if (unreadOnly) where.isRead = false;

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await db.notification.count({
      where: { userId, isRead: false },
    });

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(userId, notificationId) {
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    const updated = await db.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return updated;
  }

  async markAllAsRead(userId) {
    await db.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(userId, notificationId) {
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await db.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted' };
  }

  // Helper methods for common notifications
  async notifyBookingConfirmed(userId, slotDetails) {
    return this.createNotification(
      userId,
      'Booking Confirmed',
      `Your booking for ${slotDetails.courseName} on ${slotDetails.date} has been confirmed.`,
      'booking',
      `/bookings/${slotDetails.enrollmentId}`,
      { enrollmentId: slotDetails.enrollmentId, slotId: slotDetails.slotId }
    );
  }

  async notifyWaitlistPromotion(userId, slotDetails) {
    return this.createNotification(
      userId,
      'Slot Available!',
      `Good news! You've been promoted from the waitlist for ${slotDetails.courseName} on ${slotDetails.date}.`,
      'promotion',
      `/bookings/${slotDetails.enrollmentId}`,
      { enrollmentId: slotDetails.enrollmentId, slotId: slotDetails.slotId }
    );
  }

  async notifyPaymentReceived(userId, paymentDetails) {
    return this.createNotification(
      userId,
      'Payment Received',
      `Your payment of ₹${paymentDetails.amount} has been processed successfully.`,
      'payment',
      `/payments/${paymentDetails.paymentId}`,
      { paymentId: paymentDetails.paymentId }
    );
  }

  async notifyAccountApproved(userId) {
    return this.createNotification(
      userId,
      'Account Approved',
      'Your account has been approved. You can now access all features.',
      'approval',
      '/dashboard'
    );
  }

  async notifyAccountRejected(userId, reason) {
    return this.createNotification(
      userId,
      'Account Status Update',
      `Your account application was not approved. Reason: ${reason || 'Not specified'}`,
      'approval',
      '/support'
    );
  }

  async notifyNewBooking(teacherId, bookingDetails) {
    return this.createNotification(
      teacherId,
      'New Student Booking',
      `${bookingDetails.studentName} has booked your ${bookingDetails.courseName} slot on ${bookingDetails.date}.`,
      'booking',
      `/teacher/schedule`,
      { slotId: bookingDetails.slotId }
    );
  }
}

export default new NotificationService();
