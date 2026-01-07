import feedbackService from '../services/feedback.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const submitFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, subject, message, rating } = req.body;

    // Validation
    if (!type || !message) {
      return errorResponse(res, 'Type and message are required', 400);
    }

    const validTypes = ['general_inquiry', 'feature_request', 'bug_report'];
    if (!validTypes.includes(type)) {
      return errorResponse(res, 'Invalid feedback type. Must be: general_inquiry, feature_request, or bug_report', 400);
    }

    if (rating && (rating < 1 || rating > 5)) {
      return errorResponse(res, 'Rating must be between 1 and 5', 400);
    }

    console.log('[Feedback Controller] Submitting feedback for userId:', userId);

    const feedback = await feedbackService.createFeedback({
      userId,
      type,
      subject,
      message,
      rating,
    });

    return successResponse(res, feedback, 'Feedback submitted successfully', 201);
  } catch (error) {
    console.error('[Feedback Controller] Submit error:', error);
    return errorResponse(res, error.message || 'Failed to submit feedback', 500);
  }
};

export const getMyFeedback = async (req, res) => {
  try {
    const userId = req.user.id;

    const feedbacks = await feedbackService.getUserFeedback(userId);

    return successResponse(res, feedbacks);
  } catch (error) {
    console.error('[Feedback Controller] Get user feedback error:', error);
    return errorResponse(res, error.message || 'Failed to get feedback', 500);
  }
};

// Admin endpoints
export const getAllFeedback = async (req, res) => {
  try {
    const { status, type, page, limit } = req.query;

    const result = await feedbackService.getAllFeedback({
      status,
      type,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });

    return successResponse(res, result);
  } catch (error) {
    console.error('[Feedback Controller] Get all feedback error:', error);
    return errorResponse(res, error.message || 'Failed to get feedback', 500);
  }
};

export const updateFeedbackStatus = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'reviewed', 'resolved'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status. Must be: pending, reviewed, or resolved', 400);
    }

    const feedback = await feedbackService.updateFeedbackStatus(feedbackId, status);

    return successResponse(res, feedback, 'Feedback status updated');
  } catch (error) {
    console.error('[Feedback Controller] Update status error:', error);
    return errorResponse(res, error.message || 'Failed to update feedback', 500);
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const result = await feedbackService.deleteFeedback(feedbackId);

    return successResponse(res, result);
  } catch (error) {
    console.error('[Feedback Controller] Delete error:', error);
    return errorResponse(res, error.message || 'Failed to delete feedback', 500);
  }
};
