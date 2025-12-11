import { checkVerificationStatus, resendVerificationEmail } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const checkVerification = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const result = await checkVerificationStatus(email);
    return successResponse(res, result);
  } catch (error) {
    console.error('Check verification error:', error);
    return errorResponse(res, error.message || 'Failed to check verification status', 400);
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const result = await resendVerificationEmail(email);
    return successResponse(res, result, 'Verification email sent');
  } catch (error) {
    console.error('Resend verification error:', error);
    return errorResponse(res, error.message || 'Failed to resend verification email', 400);
  }
};

