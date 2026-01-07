import db from '../lib/db.js';

class BookingService {
  // Add slot to cart
  async addToCart(studentId, slotId) {
    // Check if slot exists and is available
    const slot = await db.timeSlot.findUnique({
      where: { id: slotId },
      include: {
        course: true,
      },
    });

    if (!slot) {
      throw new Error('Slot not found');
    }

    if (!slot.isActive || slot.status !== 'SCHEDULED') {
      throw new Error('Slot is not available for booking');
    }

    // Check if already in cart
    const existingCartItem = await db.cartItem.findUnique({
      where: {
        studentId_slotId: { studentId, slotId },
      },
    });

    if (existingCartItem) {
      throw new Error('Slot already in cart');
    }

    // Check if already enrolled
    const existingEnrollment = await db.slotEnrollment.findUnique({
      where: {
        slotId_studentId: { slotId, studentId },
      },
    });

    if (existingEnrollment && existingEnrollment.status !== 'CANCELLED') {
      throw new Error('Already enrolled in this slot');
    }

    // Add to cart
    const cartItem = await db.cartItem.create({
      data: {
        studentId,
        slotId,
        priceAtAdd: slot.course?.pricePerSlot || slot.course?.price || 0,
      },
      include: {
        slot: {
          include: {
            course: true,
          },
        },
      },
    });

    return cartItem;
  }

  // Get user's cart
  async getCart(studentId) {
    const cartItems = await db.cartItem.findMany({
      where: { studentId },
      include: {
        slot: {
          include: {
            course: {
              include: {
                building: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = cartItems.reduce((sum, item) => sum + item.priceAtAdd, 0);

    return {
      items: cartItems,
      total,
      itemCount: cartItems.length,
    };
  }

  // Remove from cart
  async removeFromCart(studentId, cartItemId) {
    const cartItem = await db.cartItem.findFirst({
      where: {
        id: cartItemId,
        studentId,
      },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    await db.cartItem.delete({
      where: { id: cartItemId },
    });

    return { message: 'Item removed from cart' };
  }

  // Clear cart
  async clearCart(studentId) {
    await db.cartItem.deleteMany({
      where: { studentId },
    });

    return { message: 'Cart cleared' };
  }

  // Book a slot directly (without cart)
  async bookSlot(studentId, slotId, paymentId = null) {
    const slot = await db.timeSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new Error('Slot not found');
    }

    if (!slot.isActive || slot.status !== 'SCHEDULED') {
      throw new Error('Slot is not available for booking');
    }

    // Check if already enrolled
    const existingEnrollment = await db.slotEnrollment.findUnique({
      where: {
        slotId_studentId: { slotId, studentId },
      },
    });

    if (existingEnrollment && existingEnrollment.status !== 'CANCELLED') {
      throw new Error('Already enrolled in this slot');
    }

    // Determine if slot is full (waitlist) or available (confirmed)
    const isFull = slot.currentEnrollment >= slot.maxCapacity;

    let enrollment;
    if (isFull) {
      // Add to waitlist
      const waitlistCount = await db.slotEnrollment.count({
        where: { slotId, status: 'WAITLIST' },
      });

      enrollment = await db.slotEnrollment.create({
        data: {
          slotId,
          studentId,
          status: 'WAITLIST',
          waitlistPosition: waitlistCount + 1,
          paymentId,
        },
      });
    } else {
      // Confirm enrollment
      enrollment = await db.slotEnrollment.create({
        data: {
          slotId,
          studentId,
          status: 'CONFIRMED',
          paymentId,
        },
      });

      // Update slot enrollment count
      await db.timeSlot.update({
        where: { id: slotId },
        data: {
          currentEnrollment: { increment: 1 },
        },
      });
    }

    return enrollment;
  }

  // Get user's bookings
  async getMyBookings(studentId, status = null) {
    const where = { studentId };
    if (status) where.status = status;

    const bookings = await db.slotEnrollment.findMany({
      where,
      include: {
        slot: {
          include: {
            course: {
              include: {
                building: {
                  select: { id: true, name: true, address: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }

  // Cancel booking
  async cancelBooking(studentId, enrollmentId, reason = null) {
    const enrollment = await db.slotEnrollment.findFirst({
      where: {
        id: enrollmentId,
        studentId,
      },
      include: {
        slot: true,
      },
    });

    if (!enrollment) {
      throw new Error('Booking not found');
    }

    if (enrollment.status === 'CANCELLED') {
      throw new Error('Booking already cancelled');
    }

    if (enrollment.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed booking');
    }

    const wasConfirmed = enrollment.status === 'CONFIRMED';

    // Cancel the enrollment
    await db.slotEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: studentId,
        cancelReason: reason,
      },
    });

    // If was confirmed, decrement slot count and promote from waitlist
    if (wasConfirmed) {
      await db.timeSlot.update({
        where: { id: enrollment.slotId },
        data: {
          currentEnrollment: { decrement: 1 },
        },
      });

      // Promote first person from waitlist
      await this.promoteFromWaitlist(enrollment.slotId);
    }

    return { message: 'Booking cancelled successfully' };
  }

  // Promote from waitlist
  async promoteFromWaitlist(slotId) {
    const nextInWaitlist = await db.slotEnrollment.findFirst({
      where: {
        slotId,
        status: 'WAITLIST',
      },
      orderBy: { waitlistPosition: 'asc' },
    });

    if (!nextInWaitlist) {
      return null;
    }

    // Promote to confirmed
    const promoted = await db.slotEnrollment.update({
      where: { id: nextInWaitlist.id },
      data: {
        status: 'CONFIRMED',
        waitlistPosition: null,
        promotedAt: new Date(),
        promotedFromWaitlist: true,
      },
    });

    // Update slot enrollment count
    await db.timeSlot.update({
      where: { id: slotId },
      data: {
        currentEnrollment: { increment: 1 },
      },
    });

    // Reorder remaining waitlist
    await db.$executeRaw`
      UPDATE slot_enrollments 
      SET waitlist_position = waitlist_position - 1 
      WHERE slot_id = ${slotId}::uuid 
      AND status = 'WAITLIST' 
      AND waitlist_position > ${nextInWaitlist.waitlistPosition}
    `;

    // TODO: Send notification to promoted user

    return promoted;
  }

  // Get waitlist position
  async getWaitlistPosition(studentId, slotId) {
    const enrollment = await db.slotEnrollment.findUnique({
      where: {
        slotId_studentId: { slotId, studentId },
      },
    });

    if (!enrollment) {
      return null;
    }

    if (enrollment.status !== 'WAITLIST') {
      return { status: enrollment.status, position: null };
    }

    return {
      status: 'WAITLIST',
      position: enrollment.waitlistPosition,
    };
  }
}

export default new BookingService();
