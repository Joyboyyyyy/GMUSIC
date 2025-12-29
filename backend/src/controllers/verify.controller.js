import authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /api/auth/verify-email?token=...
 * Verifies email token and redirects to app deep link with auth token
 * This endpoint is called from email links (HTTPS) and redirects to app
 */
export async function verifyEmailGet(req, res) {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.error('[Verify Controller] GET: No token provided');
      // Redirect to app with error - ALL redirects go to email-verified
      const appScheme = (process.env.APP_SCHEME || 'gretexmusicroom').trim().split('://')[0].replace(/\/+$/, '').trim();
      const deepLink = `${appScheme}://email-verified?error=${encodeURIComponent('Verification token is required')}`;
      return res.redirect(302, deepLink);
    }
    
    console.log('[Verify Controller] GET: Email verification request received for token (length:', token.length, ')');
    
    try {
      // Verify the token (idempotent - if already verified, still succeeds)
      const result = await authService.verifyEmail(token);
      console.log('[Verify Controller] GET: Email verification result:', result.message);
      
      // Get app scheme for deep link
      const appScheme = (process.env.APP_SCHEME || 'gretexmusicroom').trim().split('://')[0].replace(/\/+$/, '').trim();
      
      // Redirect to email-verified with auth token for auto-login
      // Backend already verified, app will use the token to auto-login
      let deepLink = `${appScheme}://email-verified`;
      
      // Add auth token to deep link for auto-login
      if (result.token) {
        deepLink += `?authToken=${encodeURIComponent(result.token)}`;
      }
      
      console.log('[Verify Controller] GET: Redirecting to app with auth token');
      
      // Redirect to app deep link
      return res.redirect(302, deepLink);
      
    } catch (verifyError) {
      // Verification failed - redirect to app with error
      console.error('[Verify Controller] GET: Verification failed:', verifyError.message);
      const appScheme = (process.env.APP_SCHEME || 'gretexmusicroom').trim().split('://')[0].replace(/\/+$/, '').trim();
      const errorMessage = verifyError.message || 'Verification failed';
      const deepLink = `${appScheme}://email-verified?error=${encodeURIComponent(errorMessage)}`;
      
      return res.redirect(302, deepLink);
    }
    
  } catch (error) {
    console.error('[Verify Controller] GET: Unexpected error:', error);
    // On unexpected error, still redirect to app - ALL redirects go to email-verified
    const appScheme = (process.env.APP_SCHEME || 'gretexmusicroom').trim().split('://')[0].replace(/\/+$/, '').trim();
    const deepLink = `${appScheme}://email-verified?error=${encodeURIComponent('Verification failed')}`;
    return res.redirect(302, deepLink);
  }
}

/**
 * POST /api/auth/verify-email
 * Verifies email token (called from app)
 * Returns JSON response for app to handle
 */
export async function verifyEmail(req, res) {
  try {
    // Extract token from request body (POST endpoint)
    const { token } = req.body;
    
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.error('[Verify Controller] POST: No token provided or invalid token');
      return errorResponse(res, 'Verification token is required', 400);
    }
    
    console.log('[Verify Controller] POST: Email verification request received for token (length:', token.length, ')');
    
    // Verify the token with the service
    const result = await authService.verifyEmail(token);
    console.log('[Verify Controller] POST: Email verified successfully');
    
    // Return JSON only - no redirects, no deep links
    return successResponse(res, result, result.message || 'Email verified successfully');
    
  } catch (error) {
    // Handle verification errors
    const errorMessage = error.message || 'Verification failed';
    console.error('[Verify Controller] POST: Email verification error:', errorMessage);
    
    // Return JSON error response
    return errorResponse(res, errorMessage, 400);
  }
}
