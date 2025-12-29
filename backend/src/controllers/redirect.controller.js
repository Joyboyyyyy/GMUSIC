/**
 * Redirect Controllers
 * 
 * These endpoints provide HTTPS redirects for email links.
 * Email clients (Gmail, Outlook, etc.) handle HTTPS links better than custom URL schemes.
 * These endpoints simply redirect to the app deep link scheme.
 * 
 * DO NOT verify tokens or touch database - that's handled by the actual auth endpoints.
 */

/**
 * GET /auth/verify-email?token=...
 * Redirects to app deep link for email verification
 */
export const verifyEmailRedirect = async (req, res) => {
  try {
    const { token } = req.query;

    // Ensure APP_SCHEME is clean (without double ://)
    // Split on :// and take first part to ensure clean scheme
    let appScheme = (process.env.APP_SCHEME || 'gretexmusicroom').trim();
    appScheme = appScheme.split('://')[0].replace(/\/+$/, '').trim();

    if (!token) {
      // If no token, redirect to app with error
      const deepLink = `${appScheme}://email-verified?error=${encodeURIComponent('Verification token is required')}`;
      return res.redirect(302, deepLink);
    }

    // Redirect to app deep link with token
    const deepLink = `${appScheme}://verify-email?token=${encodeURIComponent(token)}`;
    console.log('[Redirect] Email verification redirect:', deepLink);
    res.redirect(302, deepLink);
  } catch (error) {
    console.error('[Redirect] Email verification redirect error:', error);
    // On error, still redirect to app (let app handle error)
    let appScheme = process.env.APP_SCHEME || 'gretexmusicroom';
    appScheme = appScheme.replace(/:\/\/.*$/, '').replace(/\/+$/, '').trim();
    const deepLink = `${appScheme}://email-verified?error=${encodeURIComponent('Redirect failed')}`;
    res.redirect(302, deepLink);
  }
};

/**
 * GET /auth/reset-password?token=...
 * Redirects to app deep link for password reset
 */
export const resetPasswordRedirect = async (req, res) => {
  try {
    const { token } = req.query;

    // Ensure APP_SCHEME is clean (without double ://)
    // Split on :// and take first part to ensure clean scheme
    let appScheme = (process.env.APP_SCHEME || 'gretexmusicroom').trim();
    appScheme = appScheme.split('://')[0].replace(/\/+$/, '').trim();

    if (!token) {
      // If no token, redirect to app (app will show error)
      const deepLink = `${appScheme}://reset-password`;
      return res.redirect(302, deepLink);
    }

    // Redirect to app deep link with token
    const deepLink = `${appScheme}://reset-password?token=${encodeURIComponent(token)}`;
    console.log('[Redirect] Password reset redirect:', deepLink);
    res.redirect(302, deepLink);
  } catch (error) {
    console.error('[Redirect] Password reset redirect error:', error);
    // On error, still redirect to app (let app handle error)
    let appScheme = process.env.APP_SCHEME || 'gretexmusicroom';
    appScheme = appScheme.replace(/:\/\/.*$/, '').replace(/\/+$/, '').trim();
    const deepLink = `${appScheme}://reset-password`;
    res.redirect(302, deepLink);
  }
};

