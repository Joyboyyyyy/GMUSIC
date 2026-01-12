import express from 'express';
import teacherService from '../services/teacher.service.js';

const router = express.Router();

/**
 * GET /api/teachers/featured
 * Get featured teachers for homepage
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const teachers = await teacherService.getFeaturedTeachers(limit);
    
    res.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    console.error('[Teacher Routes] Error getting featured teachers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured teachers',
    });
  }
});

/**
 * GET /api/teachers/:teacherId
 * Get teacher details by ID
 */
router.get('/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await teacherService.getTeacherById(teacherId);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found',
      });
    }
    
    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error('[Teacher Routes] Error getting teacher:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teacher',
    });
  }
});

export default router;
