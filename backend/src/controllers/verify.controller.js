import { verifyEmailToken } from '../services/auth.service.js';

export async function verifyEmail(req, res) {
  try {
    await verifyEmailToken(req.params.token);
    
    // Redirect to deep link instead of returning JSON
    const deepLink = 'gretexmusicroom://email-verified';
    res.redirect(302, deepLink);
  } catch (err) {
    // On error, still redirect but app will handle error state
    const deepLink = 'gretexmusicroom://email-verified?error=' + encodeURIComponent(err.message);
    res.redirect(302, deepLink);
  }
}

