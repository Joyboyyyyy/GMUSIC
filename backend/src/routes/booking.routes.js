import express from 'express';
import bookingService from '../services/booking.service.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// CART ENDPOINTS
// ============================================

// Get cart
router.get('/cart', authenticate, async (req, res) => {
  try {
    const cart = await bookingService.getCart(req.user.id);
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('[Booking Routes] Error getting cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add to cart
router.post('/cart/add', authenticate, async (req, res) => {
  try {
    const { slotId } = req.body;
    
    if (!slotId) {
      return res.status(400).json({ success: false, error: 'slotId is required' });
    }
    
    const cartItem = await bookingService.addToCart(req.user.id, slotId);
    res.status(201).json({ success: true, data: cartItem });
  } catch (error) {
    console.error('[Booking Routes] Error adding to cart:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Remove from cart
router.delete('/cart/:itemId', authenticate, async (req, res) => {
  try {
    const result = await bookingService.removeFromCart(req.user.id, req.params.itemId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Booking Routes] Error removing from cart:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Clear cart
router.delete('/cart', authenticate, async (req, res) => {
  try {
    const result = await bookingService.clearCart(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Booking Routes] Error clearing cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// BOOKING ENDPOINTS
// ============================================

// Book a slot directly
router.post('/book', authenticate, async (req, res) => {
  try {
    const { slotId, paymentId } = req.body;
    
    if (!slotId) {
      return res.status(400).json({ success: false, error: 'slotId is required' });
    }
    
    const enrollment = await bookingService.bookSlot(req.user.id, slotId, paymentId);
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    console.error('[Booking Routes] Error booking slot:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get my bookings
router.get('/my-bookings', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const bookings = await bookingService.getMyBookings(req.user.id, status);
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('[Booking Routes] Error getting bookings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel booking
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await bookingService.cancelBooking(req.user.id, req.params.id, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Booking Routes] Error cancelling booking:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get waitlist position
router.get('/waitlist/:slotId', authenticate, async (req, res) => {
  try {
    const position = await bookingService.getWaitlistPosition(req.user.id, req.params.slotId);
    res.json({ success: true, data: position });
  } catch (error) {
    console.error('[Booking Routes] Error getting waitlist position:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
