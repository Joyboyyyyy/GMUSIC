import express from 'express';
import { register, login, googleLogin, getProfile, updateProfile, forgotPassword, resetPassword, resetPasswordGet, changePassword, testEmail, refreshToken } from '../controllers/auth.controller.js';
import { verifyEmail, verifyEmailGet } from '../controllers/verify.controller.js';
import { checkVerification, resendVerification } from '../controllers/verification.controller.js';
import { authenticate } from '../middleware/auth.js';

/**
 * Authentication Routes
 * 
 * PROFILE PICTURE FIELD DOCUMENTATION:
 * ====================================
 * 
 * PRIMARY FIELD: `profilePicture` (String)
 * - This is the AUTHORITATIVE field for storing profile picture URLs
 * - All clients (mobile, web) should use this field for display
 * - All upload operations should update this field
 * 
 * SECONDARY FIELD: `avatar` (String)
 * - Maintained for BACKWARD COMPATIBILITY with legacy clients
 * - Automatically synchronized with `profilePicture` on every update
 * - Will be deprecated in future versions
 * 
 * FIELD SYNCHRONIZATION:
 * - When `profilePicture` is updated, `avatar` is automatically set to the same value
 * - When `avatar` is updated (legacy clients), `profilePicture` is automatically set to the same value
 * - Both fields always contain identical values after any update operation
 * 
 * API REQUEST/RESPONSE EXAMPLES:
 * 
 * GET /api/auth/me - Get User Profile
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "name": "User Name",
 *     "profilePicture": "https://storage.url/path/to/image.jpg",  // PRIMARY - Use this field
 *     "avatar": "https://storage.url/path/to/image.jpg",          // LEGACY - Same value as profilePicture
 *     ...
 *   }
 * }
 * 
 * PUT /api/auth/me - Update User Profile (Recommended)
 * Request:
 * {
 *   "profilePicture": "https://storage.url/path/to/new-image.jpg"  // PRIMARY - Use this field
 * }
 * 
 * PUT /api/auth/me - Update User Profile (Legacy Support)
 * Request:
 * {
 *   "avatar": "https://storage.url/path/to/new-image.jpg"  // LEGACY - Still supported, syncs to profilePicture
 * }
 * 
 * Response (both requests):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "profilePicture": "https://storage.url/path/to/new-image.jpg",  // Updated
 *     "avatar": "https://storage.url/path/to/new-image.jpg",          // Synchronized
 *     ...
 *   }
 * }
 * 
 * MIGRATION NOTES FOR DEVELOPERS:
 * - Update your clients to use `profilePicture` instead of `avatar`
 * - Both fields will continue to work during the migration period
 * - The `avatar` field will be deprecated in a future version
 * - No database migration required - both fields remain in the schema
 */

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/refresh', refreshToken); // Add refresh token route
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
router.post('/change-password', authenticate, changePassword);

export default router;

