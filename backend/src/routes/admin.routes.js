import express from 'express';
import adminService from '../services/admin.service.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

// ============================================
// BUILDING MANAGEMENT
// ============================================

// Get all buildings (admin view)
router.get('/buildings', async (req, res) => {
  try {
    const buildings = await adminService.getAllBuildings();
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('[Admin Routes] Error getting buildings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create building
router.post('/buildings', async (req, res) => {
  try {
    // Check if user has admin role
    if (!['SUPER_ADMIN', 'ACADEMY_ADMIN', 'BUILDING_ADMIN', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const building = await adminService.createBuilding(req.body, req.user.id);
    res.status(201).json({ success: true, data: building });
  } catch (error) {
    console.error('[Admin Routes] Error creating building:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update building
router.put('/buildings/:id', async (req, res) => {
  try {
    if (!['SUPER_ADMIN', 'ACADEMY_ADMIN', 'BUILDING_ADMIN', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const building = await adminService.updateBuilding(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: building });
  } catch (error) {
    console.error('[Admin Routes] Error updating building:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete building
router.delete('/buildings/:id', async (req, res) => {
  try {
    if (!['SUPER_ADMIN', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Super admin access required' });
    }

    await adminService.deleteBuilding(req.params.id);
    res.json({ success: true, message: 'Building deleted' });
  } catch (error) {
    console.error('[Admin Routes] Error deleting building:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});


// ============================================
// COURSE MANAGEMENT
// ============================================

// Get all courses (admin view)
router.get('/courses', async (req, res) => {
  try {
    const courses = await adminService.getAllCourses();
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('[Admin Routes] Error getting courses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get course by ID
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await adminService.getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    console.error('[Admin Routes] Error getting course:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create course
router.post('/courses', async (req, res) => {
  try {
    if (!['SUPER_ADMIN', 'ACADEMY_ADMIN', 'BUILDING_ADMIN', 'TEACHER', 'admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Admin or teacher access required' });
    }

    const course = await adminService.createCourse(req.body, req.user.id);
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error('[Admin Routes] Error creating course:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update course
router.put('/courses/:id', async (req, res) => {
  try {
    if (!['SUPER_ADMIN', 'ACADEMY_ADMIN', 'BUILDING_ADMIN', 'TEACHER', 'admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Admin or teacher access required' });
    }

    const course = await adminService.updateCourse(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: course });
  } catch (error) {
    console.error('[Admin Routes] Error updating course:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete course
router.delete('/courses/:id', async (req, res) => {
  try {
    if (!['SUPER_ADMIN', 'ACADEMY_ADMIN', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    await adminService.deleteCourse(req.params.id);
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    console.error('[Admin Routes] Error deleting course:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});


// ============================================
// USER BUILDING ACCESS MANAGEMENT
// ============================================

// Get users pending building approval
router.get('/building-approvals/pending', async (req, res) => {
  try {
    if (!['SUPER_ADMIN', 'ACADEMY_ADMIN', 'BUILDING_ADMIN', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const users = await adminService.getPendingBuildingApprovals();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('[Admin Routes] Error getting pending approvals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve user building access
router.post('/building-approvals/:userId/approve', async (req, res) => {
  try {
    if (!['SUPER_ADMIN', 'ACADEMY_ADMIN', 'BUILDING_ADMIN', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const result = await adminService.approveBuildingAccess(req.params.userId, req.user.id);
    res.json({ success: true, data: result, message: 'Building access approved' });
  } catch (error) {
    console.error('[Admin Routes] Error approving building access:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Reject user building access
router.post('/building-approvals/:userId/reject', async (req, res) => {
  try {
    if (!['SUPER_ADMIN', 'ACADEMY_ADMIN', 'BUILDING_ADMIN', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { reason } = req.body;
    const user = await adminService.rejectBuildingAccess(req.params.userId, req.user.id, reason);
    res.json({ success: true, data: user, message: 'Building access rejected' });
  } catch (error) {
    console.error('[Admin Routes] Error rejecting building access:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
