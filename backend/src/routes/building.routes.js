import express from 'express';
import buildingService from '../services/building.service.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Search buildings by name/city (no auth required - for signup)
router.get('/search', async (req, res) => {
  try {
    const { q = '', limit = 20 } = req.query;
    const buildings = await buildingService.searchBuildings(q, parseInt(limit));
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('[Building Routes] Error searching buildings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all public buildings (no auth required)
router.get('/public', async (req, res) => {
  try {
    const buildings = await buildingService.getPublicBuildings();
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('[Building Routes] Error getting public buildings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get nearby buildings (no auth required)
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        error: 'Latitude and longitude are required' 
      });
    }

    const buildings = await buildingService.getNearbyBuildings(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius) || 10
    );
    
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('[Building Routes] Error getting nearby buildings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate building code (no auth required)
router.get('/validate-code/:code', async (req, res) => {
  try {
    const building = await buildingService.getBuildingByCode(req.params.code);
    res.json({ 
      success: true, 
      data: { 
        id: building.id, 
        name: building.name,
        valid: true 
      } 
    });
  } catch (error) {
    res.status(404).json({ success: false, error: 'Invalid building code', valid: false });
  }
});

// Get all buildings (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    const { visibilityType, approvalStatus } = req.query;
    const buildings = await buildingService.getBuildings({ visibilityType, approvalStatus });
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('[Building Routes] Error getting buildings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's building with courses - MUST be before /:id to avoid matching 'my-building' as an ID
router.get('/my-building/courses', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's building ID and approval status
    const user = await buildingService.getUserBuilding(userId);
    
    if (!user || !user.buildingId) {
      return res.status(404).json({ 
        success: false, 
        error: 'No building associated with your account' 
      });
    }
    
    const building = await buildingService.getBuildingWithCourses(user.buildingId);
    res.json({ success: true, data: building });
  } catch (error) {
    console.error('[Building Routes] Error getting user building:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get building by ID - MUST be after specific routes like /my-building/courses
router.get('/:id', authenticate, async (req, res) => {
  try {
    const building = await buildingService.getBuildingById(req.params.id);
    res.json({ success: true, data: building });
  } catch (error) {
    console.error('[Building Routes] Error getting building:', error);
    res.status(404).json({ success: false, error: error.message });
  }
});

// Get courses for a specific building (authenticated users only)
router.get('/:buildingId/courses', authenticate, async (req, res) => {
  try {
    const { buildingId } = req.params;
    const userId = req.user.id;
    
    // Security: User can only access courses for their approved building
    const user = await buildingService.getUserBuilding(userId);
    
    if (!user || user.buildingId !== buildingId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have access to this building\'s courses' 
      });
    }
    
    const courses = await buildingService.getBuildingCourses(buildingId);
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('[Building Routes] Error getting building courses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create building (registration)
router.post('/', authenticate, async (req, res) => {
  try {
    const building = await buildingService.createBuilding(req.body, req.user.id);
    res.status(201).json({ success: true, data: building });
  } catch (error) {
    console.error('[Building Routes] Error creating building:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update building
router.put('/:id', authenticate, async (req, res) => {
  try {
    const building = await buildingService.updateBuilding(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: building });
  } catch (error) {
    console.error('[Building Routes] Error updating building:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Approve building (super admin only)
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const building = await buildingService.approveBuilding(req.params.id, req.user.id);
    res.json({ success: true, data: building });
  } catch (error) {
    console.error('[Building Routes] Error approving building:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Reject building (super admin only)
router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const { reason } = req.body;
    const building = await buildingService.rejectBuilding(req.params.id, req.user.id, reason);
    res.json({ success: true, data: building });
  } catch (error) {
    console.error('[Building Routes] Error rejecting building:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
