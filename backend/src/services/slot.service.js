import db from '../lib/db.js';
import { addDays, format, parseISO, isWithinInterval } from 'date-fns';

class SlotService {
  // Generate time slots for a course based on its schedule
  async generateSlotsForCourse(courseId) {
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    if (!course.startDate || !course.endDate || !course.daysOfWeek?.length) {
      throw new Error('Course schedule not configured');
    }

    const slots = [];
    let currentDate = new Date(course.startDate);
    const endDate = new Date(course.endDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      if (course.daysOfWeek.includes(dayOfWeek)) {
        // Parse time strings (e.g., "09:00")
        const [startHour, startMin] = (course.defaultStartTime || '09:00').split(':').map(Number);
        const [endHour, endMin] = (course.defaultEndTime || '10:00').split(':').map(Number);

        const startTime = new Date(currentDate);
        startTime.setHours(startHour, startMin, 0, 0);

        const endTime = new Date(currentDate);
        endTime.setHours(endHour, endMin, 0, 0);

        slots.push({
          courseId,
          slotDate: currentDate,
          startTime,
          endTime,
          maxCapacity: course.maxStudentsPerSlot || 1,
          currentEnrollment: 0,
          status: 'SCHEDULED',
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    // Bulk create slots
    if (slots.length > 0) {
      await db.timeSlot.createMany({
        data: slots,
        skipDuplicates: true,
      });
    }

    return slots.length;
  }

  async getAvailableSlots(filters = {}) {
    const { courseId, buildingId, startDate, endDate, teacherId, status = 'SCHEDULED' } = filters;

    const where = {
      isActive: true,
      status,
    };

    if (courseId) where.courseId = courseId;
    if (teacherId) where.teacherId = teacherId;

    if (startDate || endDate) {
      where.slotDate = {};
      if (startDate) where.slotDate.gte = new Date(startDate);
      if (endDate) where.slotDate.lte = new Date(endDate);
    }

    // Filter by building through course relation
    const include = {
      course: {
        select: {
          id: true,
          title: true,
          instrument: true,
          pricePerSlot: true,
          price: true,
          buildingId: true,
          building: {
            select: { id: true, name: true },
          },
        },
      },
    };

    let slots = await db.timeSlot.findMany({
      where,
      include,
      orderBy: [{ slotDate: 'asc' }, { startTime: 'asc' }],
    });

    // Filter by building if specified
    if (buildingId) {
      slots = slots.filter(slot => slot.course?.buildingId === buildingId);
    }

    // Add availability info
    return slots.map(slot => ({
      ...slot,
      availableSpots: slot.maxCapacity - slot.currentEnrollment,
      isFull: slot.currentEnrollment >= slot.maxCapacity,
    }));
  }

  async getSlotById(id) {
    const slot = await db.timeSlot.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            building: true,
          },
        },
        slotEnrollments: {
          where: { status: { in: ['CONFIRMED', 'WAITLIST'] } },
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!slot) {
      throw new Error('Slot not found');
    }

    return {
      ...slot,
      availableSpots: slot.maxCapacity - slot.currentEnrollment,
      isFull: slot.currentEnrollment >= slot.maxCapacity,
    };
  }

  async assignTeacherToSlot(slotId, teacherId) {
    const slot = await db.timeSlot.update({
      where: { id: slotId },
      data: { teacherId },
    });

    return slot;
  }

  async updateSlotStatus(slotId, status) {
    const slot = await db.timeSlot.update({
      where: { id: slotId },
      data: { status },
    });

    return slot;
  }

  async cancelSlot(slotId, reason) {
    // Cancel the slot
    const slot = await db.timeSlot.update({
      where: { id: slotId },
      data: { 
        status: 'CANCELLED',
        isActive: false,
      },
    });

    // Cancel all enrollments for this slot
    await db.slotEnrollment.updateMany({
      where: { slotId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason || 'Slot cancelled',
      },
    });

    return slot;
  }

  async getSlotsByTeacher(teacherId, startDate, endDate) {
    const where = {
      teacherId,
      isActive: true,
    };

    if (startDate || endDate) {
      where.slotDate = {};
      if (startDate) where.slotDate.gte = new Date(startDate);
      if (endDate) where.slotDate.lte = new Date(endDate);
    }

    const slots = await db.timeSlot.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true, instrument: true },
        },
        slotEnrollments: {
          where: { status: 'CONFIRMED' },
          include: {
            student: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: [{ slotDate: 'asc' }, { startTime: 'asc' }],
    });

    return slots;
  }
}

export default new SlotService();
