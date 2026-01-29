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

// Get buildings with music rooms (for jamming room booking)
router.get('/with-music-rooms', async (req, res) => {
  try {
    const buildings = await buildingService.getBuildingsWithMusicRooms();
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('[Building Routes] Error getting buildings with music rooms:', error);
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

// Get all buildings for browsing (public - no auth required)
router.get('/all', async (req, res) => {
  console.log('🔍 [DEBUG] /all route hit - this should NOT require auth');
  try {
    const buildings = await buildingService.getAllBuildingsForBrowsing();
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('[Building Routes] Error getting all buildings:', error);
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
    
    // Check if user is approved for this building
    if (user.approvalStatus !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false, 
        error: 'Your building access is pending approval',
        approvalStatus: user.approvalStatus
      });
    }
    
    const building = await buildingService.getBuildingWithCourses(user.buildingId);
    res.json({ success: true, data: building });
  } catch (error) {
    console.error('[Building Routes] Error getting user building:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get building by ID (public - no auth required for browsing)
router.get('/:id', async (req, res) => {
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

// Request access to a private building
router.post('/:buildingId/request-access', authenticate, async (req, res) => {
  try {
    const { buildingId } = req.params;
    const userId = req.user.id;
    const { residenceAddress, residenceFlatNo, residenceFloor, residenceProofType, residenceProofUrl } = req.body;
    
    const result = await buildingService.requestBuildingAccess(userId, buildingId, {
      residenceAddress,
      residenceFlatNo,
      residenceFloor,
      residenceProofType,
      residenceProofUrl,
    });
    
    // Notify building admins about the new access request
    const notificationService = (await import('../services/notification.service.js')).default;
    await notificationService.notifyBuildingAdminsNewEnrollment(
      buildingId,
      `New building access request from ${req.user.name || req.user.email}`,
      'BUILDING_ACCESS_REQUEST'
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Building Routes] Error requesting building access:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get pending building access requests (building admin only)
router.get('/:buildingId/access-requests', authenticate, async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    // Check if user is building admin for this building
    if (req.user.role !== 'BUILDING_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    if (req.user.role === 'BUILDING_ADMIN' && req.user.buildingId !== buildingId) {
      return res.status(403).json({ success: false, error: 'You can only view requests for your building' });
    }
    
    const requests = await buildingService.getPendingBuildingAccessRequests(buildingId);
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('[Building Routes] Error getting access requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve building access request (building admin only)
router.post('/access-requests/:userId/approve', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'BUILDING_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    const result = await buildingService.approveBuildingAccessRequest(req.params.userId, req.user.id);
    
    // Notify user about approval
    const notificationService = (await import('../services/notification.service.js')).default;
    await notificationService.createNotification(
      req.params.userId,
      'Building Access Approved',
      'Your building access request has been approved. You can now access building courses.',
      'BUILDING_ACCESS_APPROVED'
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Building Routes] Error approving access request:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Reject building access request (building admin only)
router.post('/access-requests/:userId/reject', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'BUILDING_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    const { reason } = req.body;
    const result = await buildingService.rejectBuildingAccessRequest(req.params.userId, req.user.id, reason);
    
    // Notify user about rejection
    const notificationService = (await import('../services/notification.service.js')).default;
    await notificationService.createNotification(
      req.params.userId,
      'Building Access Rejected',
      reason || 'Your building access request has been rejected.',
      'BUILDING_ACCESS_REJECTED'
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Building Routes] Error rejecting access request:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
