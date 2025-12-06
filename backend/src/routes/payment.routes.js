import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getUserPurchases,
  refundPurchase,
} from '../controllers/payment.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (students)
router.post('/create-intent', authenticate, createPaymentIntent);
router.post('/confirm', authenticate, confirmPayment);
router.get('/my-purchases', authenticate, getUserPurchases);

// Admin routes
router.post('/:purchaseId/refund', authenticate, requireRole('ADMIN'), refundPurchase);

export default router;

