import paymentService from '../services/payment.service.js';
import zohoService from '../services/zoho.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, amount } = req.body;

    if (!courseId || !amount) {
      return errorResponse(res, 'Course ID and amount are required', 400);
    }

    const result = await paymentService.createPaymentIntent(userId, courseId, amount);

    // Create lead in Zoho CRM
    try {
      await zohoService.createLeadFromUser(req.user, courseId);
    } catch (zohoError) {
      console.error('Zoho lead creation failed (non-critical):', zohoError);
      // Continue even if Zoho fails
    }

    return successResponse(res, result, 'Payment intent created');
  } catch (error) {
    console.error('Create payment intent error:', error);
    return errorResponse(res, error.message || 'Failed to create payment intent', 400);
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { purchaseId, paymentId } = req.body;

    if (!purchaseId) {
      return errorResponse(res, 'Purchase ID is required', 400);
    }

    const purchase = await paymentService.confirmPayment(purchaseId, { paymentId });

    // Update Zoho CRM
    if (purchase.zohoLeadId) {
      try {
        await zohoService.updateLeadOnPurchase(purchase.zohoLeadId, purchase);
      } catch (zohoError) {
        console.error('Zoho update failed (non-critical):', zohoError);
      }
    }

    return successResponse(res, purchase, 'Payment confirmed successfully');
  } catch (error) {
    console.error('Confirm payment error:', error);
    return errorResponse(res, error.message || 'Failed to confirm payment', 400);
  }
};

export const getUserPurchases = async (req, res) => {
  try {
    const userId = req.user.id;

    const purchases = await paymentService.getUserPurchases(userId);

    return successResponse(res, purchases);
  } catch (error) {
    console.error('Get purchases error:', error);
    return errorResponse(res, 'Failed to fetch purchases');
  }
};

export const refundPurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const result = await paymentService.refundPurchase(purchaseId);

    return successResponse(res, result);
  } catch (error) {
    console.error('Refund error:', error);
    return errorResponse(res, error.message || 'Failed to process refund', 400);
  }
};

