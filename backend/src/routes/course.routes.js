import express from 'express';
import {
  getAllCourses,
  getCourseById,
  getUserCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  addTrack,
} from '../controllers/course.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllCourses);

// Protected routes (students) - MUST be before /:courseId to avoid route conflict
router.get('/user/my-courses', authenticate, getUserCourses);

// Public route with param - MUST be after specific routes
router.get('/:courseId', getCourseById);

// Admin/Teacher routes
router.post('/', authenticate, requireRole('ADMIN', 'TEACHER'), createCourse);
router.put('/:courseId', authenticate, requireRole('ADMIN', 'TEACHER'), updateCourse);
router.delete('/:courseId', authenticate, requireRole('ADMIN'), deleteCourse);
router.post('/:courseId/tracks', authenticate, requireRole('ADMIN', 'TEACHER'), addTrack);

export default router;

