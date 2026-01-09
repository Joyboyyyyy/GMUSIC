import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getUserPurchases,
  refundPurchase,
} from '../controllers/payment.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import db from '../lib/db.js';
import { getRazorpay } from '../config/razorpay.js';

const router = express.Router();

// Protected routes (students)
router.post('/create-intent', authenticate, createPaymentIntent);
router.post('/confirm', authenticate, confirmPayment);
router.get('/my-purchases', authenticate, getUserPurchases);

// Get payment history with Razorpay details
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch payments from database
    const payments = await db.payment.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with Razorpay details if available
    const razorpay = getRazorpay();
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        let razorpayDetails = null;
        let courseDetails = null;

        // Try to fetch Razorpay payment details
        if (razorpay && payment.gatewayPaymentId) {
          try {
            razorpayDetails = await razorpay.payments.fetch(payment.gatewayPaymentId);
          } catch (err) {
            console.log(`[Payment Routes] Could not fetch Razorpay details for ${payment.gatewayPaymentId}`);
          }
        }

        // Try to fetch course details from order notes
        if (razorpay && payment.gatewayOrderId) {
          try {
            const order = await razorpay.orders.fetch(payment.gatewayOrderId);
            if (order.notes?.courseId) {
              const course = await db.course.findUnique({
                where: { id: order.notes.courseId },
                select: { id: true, name: true, instrument: true, pricePerSlot: true },
              });
              courseDetails = course;
            }
          } catch (err) {
            console.log(`[Payment Routes] Could not fetch order details for ${payment.gatewayOrderId}`);
          }
        }

        return {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          gatewayOrderId: payment.gatewayOrderId,
          gatewayPaymentId: payment.gatewayPaymentId,
          slotIds: payment.slotIds,
          initiatedAt: payment.initiatedAt,
          completedAt: payment.completedAt,
          failedAt: payment.failedAt,
          refundedAt: payment.refundedAt,
          refundAmount: payment.refundAmount,
          createdAt: payment.createdAt,
          // Razorpay enriched data
          razorpay: razorpayDetails ? {
            method: razorpayDetails.method,
            bank: razorpayDetails.bank,
            wallet: razorpayDetails.wallet,
            vpa: razorpayDetails.vpa,
            email: razorpayDetails.email,
            contact: razorpayDetails.contact,
            card: razorpayDetails.card ? {
              last4: razorpayDetails.card.last4,
              network: razorpayDetails.card.network,
              type: razorpayDetails.card.type,
            } : null,
            description: razorpayDetails.description,
            invoiceId: razorpayDetails.invoice_id,
          } : null,
          // Course details
          course: courseDetails,
        };
      })
    );

    res.json({ success: true, data: enrichedPayments });
  } catch (error) {
    console.error('[Payment Routes] Error fetching payment history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin routes
router.post('/:purchaseId/refund', authenticate, requireRole('ADMIN'), refundPurchase);

export default router;
