import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { verifyEmail } from '../controllers/verify.controller.js';
import { checkVerification, resendVerification } from '../controllers/verification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.get('/check-verification', checkVerification);
router.post('/resend-verification', resendVerification);

// Protected routes
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);

export default router;

