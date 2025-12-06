import express from 'express';
import { syncUserData, createLead } from '../controllers/zoho.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.post('/sync', authenticate, syncUserData);
router.post('/leads', authenticate, createLead);

export default router;

