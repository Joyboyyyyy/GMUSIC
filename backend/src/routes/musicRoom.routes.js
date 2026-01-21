import express from 'express';
import musicRoomService from '../services/musicRoom.service.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// PUBLIC ENDPOINTS (No authentication required)
// ============================================

// Get all buildings with music rooms (for jamming room selection)
router.get('/buildings', async (req, res) => {
  try {
    const buildings = await musicRoomService.getBuildingsWithMusicRooms();
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('[Music Room Routes] Error getting buildings with music rooms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available time slots for a building (for jamming room booking)
router.get('/buildings/:buildingId/slots', async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { date } = req.query;
    
    // VALIDATION: Validate date parameter if provided
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid date format. Expected YYYY-MM-DD' 
        });
      }
      
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid date value' 
        });
      }
    }
    
    const slots = await musicRoomService.getAvailableSlots(buildingId, date);
    res.json({ success: true, data: slots });
  } catch (error) {
    console.error('[Music Room Routes] Error getting available slots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search music rooms by instrument, location, etc.
router.get('/search', async (req, res) => {
  try {
    const { q, instrument, city } = req.query;
    const musicRooms = await musicRoomService.searchMusicRooms(q, instrument, city);
    res.json({ success: true, data: musicRooms });
  } catch (error) {
    console.error('[Music Room Routes] Error searching music rooms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get nearby music rooms
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    // VALIDATION: Check required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        error: 'Latitude and longitude are required' 
      });
    }

    // VALIDATION: Validate coordinate values
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius) || 10;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Latitude and longitude must be valid numbers' 
      });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({ 
        success: false, 
        error: 'Latitude must be between -90 and 90' 
      });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({ 
        success: false, 
        error: 'Longitude must be between -180 and 180' 
      });
    }

    if (rad <= 0 || rad > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Radius must be between 0 and 100 km' 
      });
    }

    const musicRooms = await musicRoomService.getNearbyMusicRooms(lat, lng, rad);
    
    res.json({ success: true, data: musicRooms });
  } catch (error) {
    console.error('[Music Room Routes] Error getting nearby music rooms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// AUTHENTICATED ENDPOINTS
// ============================================

// Get music rooms for a specific building
router.get('/buildings/:buildingId', authenticate, async (req, res) => {
  try {
    const { buildingId } = req.params;
    const musicRooms = await musicRoomService.getMusicRoomsByBuilding(buildingId);
    res.json({ success: true, data: musicRooms });
  } catch (error) {
    console.error('[Music Room Routes] Error getting music rooms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get music room details by ID
router.get('/:roomId', authenticate, async (req, res) => {
  try {
    const musicRoom = await musicRoomService.getMusicRoomById(req.params.roomId);
    
    if (!musicRoom) {
      return res.status(404).json({ success: false, error: 'Music room not found' });
    }
    
    res.json({ success: true, data: musicRoom });
  } catch (error) {
    console.error('[Music Room Routes] Error getting music room:', error);
    
    // FIX: Return appropriate status code based on error type
    if (error.message === 'Music room not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Create music room (building admin or super admin only)
router.post('/buildings/:buildingId', authenticate, async (req, res) => {
  try {
    // FIX: Type-safe authorization check
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const isBuildingAdmin = req.user.role === 'BUILDING_ADMIN' && 
                           String(req.user.buildingId) === String(req.params.buildingId);
    
    if (!isSuperAdmin && !isBuildingAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const musicRoom = await musicRoomService.createMusicRoom(req.params.buildingId, req.body);
    res.status(201).json({ success: true, data: musicRoom });
  } catch (error) {
    console.error('[Music Room Routes] Error creating music room:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update music room (building admin or super admin only)
router.put('/:roomId', authenticate, async (req, res) => {
  try {
    // Get the music room to check building ownership
    const existingRoom = await musicRoomService.getMusicRoomById(req.params.roomId);
    
    if (!existingRoom) {
      return res.status(404).json({ success: false, error: 'Music room not found' });
    }
    
    // FIX: Type-safe authorization check
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const isBuildingAdmin = req.user.role === 'BUILDING_ADMIN' && 
                           String(req.user.buildingId) === String(existingRoom.buildingId);
    
    if (!isSuperAdmin && !isBuildingAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const musicRoom = await musicRoomService.updateMusicRoom(req.params.roomId, req.body);
    res.json({ success: true, data: musicRoom });
  } catch (error) {
    console.error('[Music Room Routes] Error updating music room:', error);
    
    // FIX: Consistent error handling
    if (error.message === 'Music room not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete music room (building admin or super admin only)
router.delete('/:roomId', authenticate, async (req, res) => {
  try {
    // Get the music room to check building ownership
    const existingRoom = await musicRoomService.getMusicRoomById(req.params.roomId);
    
    if (!existingRoom) {
      return res.status(404).json({ success: false, error: 'Music room not found' });
    }
    
    // FIX: Type-safe authorization check
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const isBuildingAdmin = req.user.role === 'BUILDING_ADMIN' && 
                           String(req.user.buildingId) === String(existingRoom.buildingId);
    
    if (!isSuperAdmin && !isBuildingAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const musicRoom = await musicRoomService.deleteMusicRoom(req.params.roomId);
    res.json({ success: true, data: musicRoom });
  } catch (error) {
    console.error('[Music Room Routes] Error deleting music room:', error);
    
    // FIX: Consistent error handling
    if (error.message === 'Music room not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;