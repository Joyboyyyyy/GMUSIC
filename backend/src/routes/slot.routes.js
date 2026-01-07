import express from 'express';
import slotService from '../services/slot.service.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get available slots (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { courseId, buildingId, startDate, endDate, teacherId, status } = req.query;
    
    const slots = await slotService.getAvailableSlots({
      courseId,
      buildingId,
      startDate,
      endDate,
      teacherId,
      status,
    });
    
    res.json({ success: true, data: slots });
  } catch (error) {
    console.error('[Slot Routes] Error getting slots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get slot by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const slot = await slotService.getSlotById(req.params.id);
    res.json({ success: true, data: slot });
  } catch (error) {
    console.error('[Slot Routes] Error getting slot:', error);
    res.status(404).json({ success: false, error: error.message });
  }
});

// Generate slots for a course (admin/teacher)
router.post('/generate/:courseId', authenticate, async (req, res) => {
  try {
    const count = await slotService.generateSlotsForCourse(req.params.courseId);
    res.json({ success: true, data: { slotsCreated: count } });
  } catch (error) {
    console.error('[Slot Routes] Error generating slots:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Assign teacher to slot
router.post('/:id/assign-teacher', authenticate, async (req, res) => {
  try {
    const { teacherId } = req.body;
    const slot = await slotService.assignTeacherToSlot(req.params.id, teacherId);
    res.json({ success: true, data: slot });
  } catch (error) {
    console.error('[Slot Routes] Error assigning teacher:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update slot status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const slot = await slotService.updateSlotStatus(req.params.id, status);
    res.json({ success: true, data: slot });
  } catch (error) {
    console.error('[Slot Routes] Error updating slot status:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Cancel slot
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const slot = await slotService.cancelSlot(req.params.id, reason);
    res.json({ success: true, data: slot });
  } catch (error) {
    console.error('[Slot Routes] Error cancelling slot:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get teacher's schedule
router.get('/teacher/:teacherId', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const slots = await slotService.getSlotsByTeacher(req.params.teacherId, startDate, endDate);
    res.json({ success: true, data: slots });
  } catch (error) {
    console.error('[Slot Routes] Error getting teacher schedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
