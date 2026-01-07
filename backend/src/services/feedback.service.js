import db from '../lib/db.js';

class FeedbackService {
  async createFeedback({ userId, type, subject, message, rating }) {
    console.log('[Feedback Service] Creating feedback for userId:', userId);

    const feedback = await db.feedback.create({
      data: {
        userId,
        type,
        subject: subject || null,
        message,
        rating: rating || null,
        status: 'pending',
      },
      select: {
        id: true,
        type: true,
        subject: true,
        message: true,
        rating: true,
        status: true,
        createdAt: true,
      },
    });

    console.log('[Feedback Service] Feedback created:', feedback.id);
    return feedback;
  }

  async getUserFeedback(userId) {
    const feedbacks = await db.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        subject: true,
        message: true,
        rating: true,
        status: true,
        createdAt: true,
      },
    });

    return feedbacks;
  }

  async getAllFeedback({ status, type, page = 1, limit = 20 }) {
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [feedbacks, total] = await Promise.all([
      db.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      db.feedback.count({ where }),
    ]);

    return {
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateFeedbackStatus(feedbackId, status) {
    const feedback = await db.feedback.update({
      where: { id: feedbackId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return feedback;
  }

  async deleteFeedback(feedbackId) {
    await db.feedback.delete({
      where: { id: feedbackId },
    });

    return { message: 'Feedback deleted successfully' };
  }
}

export default new FeedbackService();
