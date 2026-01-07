import express from 'express';
import {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} from '../controllers/feedback.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// User routes (authenticated)
router.post('/', authenticate, submitFeedback);
router.get('/my', authenticate, getMyFeedback);

// Admin routes
router.get('/all', authenticate, requireRole('SUPER_ADMIN', 'ACADEMY_ADMIN'), getAllFeedback);
router.patch('/:feedbackId/status', authenticate, requireRole('SUPER_ADMIN', 'ACADEMY_ADMIN'), updateFeedbackStatus);
router.delete('/:feedbackId', authenticate, requireRole('SUPER_ADMIN'), deleteFeedback);

export default router;
