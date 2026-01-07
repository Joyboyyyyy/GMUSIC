import express from 'express';
import { search } from '../controllers/search.controller.js';

const router = express.Router();

// Public search endpoint
router.get('/', search);

export default router;
