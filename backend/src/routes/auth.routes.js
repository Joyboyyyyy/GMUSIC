import express from 'express';
import { register, login, googleLogin, getProfile, updateProfile, forgotPassword, resetPassword, resetPasswordGet, testEmail } from '../controllers/auth.controller.js';
import { verifyEmail, verifyEmailGet } from '../controllers/verify.controller.js';
import { checkVerification, resendVerification } from '../controllers/verification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password', resetPasswordGet);
router.get('/reset-password/:token', resetPasswordGet);
router.post('/reset-password', resetPassword);
router.get('/verify-email', verifyEmailGet); // GET for email links (verifies and redirects to app)
router.post('/verify-email', verifyEmail); // POST for app API calls (returns JSON)
router.get('/check-verification', checkVerification);
router.post('/resend-verification', resendVerification);
router.post('/test-email', testEmail);

// Protected routes
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);

export default router;

