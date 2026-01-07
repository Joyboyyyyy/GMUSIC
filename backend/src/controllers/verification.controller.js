import { checkVerificationStatus, resendVerificationEmail } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const checkVerification = async (req, res) => {
  try {
    const { email } = req.query;

    console.log('[Verification Controller] Check verification request for email:', email);

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const result = await checkVerificationStatus(email);
    console.log('[Verification Controller] Verification status checked:', result);
    return successResponse(res, result);
  } catch (error) {
    console.error('[Verification Controller] Check verification error:', error);
    return errorResponse(res, error.message || 'Failed to check verification status', 400);
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('[Verification Controller] Resend verification request for email:', email);

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const result = await resendVerificationEmail(email);
    console.log('[Verification Controller] Verification email resent successfully');
    return successResponse(res, result, 'Verification email sent');
  } catch (error) {
    console.error('[Verification Controller] Resend verification error:', error);
    return errorResponse(res, error.message || 'Failed to resend verification email', 400);
  }
};

