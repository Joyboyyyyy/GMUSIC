import db from '../lib/db.js';

class MusicRoomService {
  // Get all music rooms for a building
  async getMusicRoomsByBuilding(buildingId) {
    const musicRooms = await db.musicRoom.findMany({
      where: {
        buildingId,
        isActive: true,
      },
      include: {
        building: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            contactPhone: true,
          },
        },
        courses: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            instrument: true,
            pricePerSlot: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return musicRooms.map(room => ({
      id: room.id,
      name: room.name,
      floor: room.floor,
      capacity: room.capacity,
      instruments: room.instruments,
      building: room.building,
      courses: room.courses,
      isActive: room.isActive,
      createdAt: room.createdAt,
    }));
  }

  // Get all buildings with music rooms (for jamming room selection)
  async getBuildingsWithMusicRooms() {
    const buildings = await db.building.findMany({
      where: {
        isActive: true,
        approvalStatus: 'ACTIVE',
        musicRooms: {
          some: {
            isActive: true,
          },
        },
      },
      include: {
        musicRooms: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            floor: true,
            capacity: true,
            instruments: true,
          },
        },
        _count: {
          select: {
            musicRooms: { where: { isActive: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return buildings.map(building => ({
      id: building.id,
      name: building.name,
      address: building.address,
      city: building.city,
      state: building.state,
      latitude: building.latitude,
      longitude: building.longitude,
      contactPhone: building.contactPhone,
      visibilityType: building.visibilityType,
      musicRooms: building.musicRooms,
      musicRoomCount: building._count.musicRooms,
    }));
  }

  // Get available time slots for a music room
  async getAvailableSlots(buildingId, date = null) {
    // VALIDATION: Verify building exists and is active
    const building = await db.building.findUnique({
      where: { id: buildingId },
      select: { 
        id: true, 
        isActive: true, 
        approvalStatus: true,
        name: true,
      },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    if (!building.isActive || building.approvalStatus !== 'ACTIVE') {
      throw new Error('Building is not active or approved');
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all music rooms for the building
    const musicRooms = await db.musicRoom.findMany({
      where: {
        buildingId,
        isActive: true,
      },
    });

    if (musicRooms.length === 0) {
      return [];
    }

    // SECURITY: Get price from environment variable or use default
    // TODO: Add jammingRoomPricePerHour field to Building model for per-building pricing
    const pricePerHour = parseInt(process.env.JAMMING_ROOM_PRICE_PER_HOUR) || 500;

    // FIX: Use deterministic availability based on actual bookings
    // TODO: Query actual SlotEnrollment table for real availability
    // For now, return all slots as available (deterministic behavior)
    const timeSlots = [];
    const baseDate = new Date(targetDate);
    
    for (let hour = 9; hour <= 20; hour++) {
      const slotTime = new Date(baseDate);
      slotTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(slotTime);
      endTime.setHours(hour + 1, 0, 0, 0);

      // FIX: Deterministic availability - all slots available by default
      // In production, this should query the booking database
      const isAvailable = true;

      timeSlots.push({
        id: `slot-${buildingId}-${hour}-${targetDate.toISOString().split('T')[0]}`,
        time: slotTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        startTime: slotTime.toISOString(),
        endTime: endTime.toISOString(),
        available: isAvailable,
        buildingId,
        buildingName: building.name,
        date: targetDate.toISOString().split('T')[0],
        price: pricePerHour, // Price from backend configuration
        duration: 60, // 1 hour
      });
    }

    return timeSlots;
  }

  // Get music room details by ID
  async getMusicRoomById(roomId) {
    const musicRoom = await db.musicRoom.findUnique({
      where: { id: roomId },
      include: {
        building: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            contactPhone: true,
            latitude: true,
            longitude: true,
          },
        },
        courses: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            instrument: true,
            pricePerSlot: true,
            durationMinutes: true,
          },
        },
      },
    });

    if (!musicRoom) {
      throw new Error('Music room not found');
    }

    return musicRoom;
  }

  // Create a new music room (admin only)
  async createMusicRoom(buildingId, roomData) {
    // VALIDATION: Verify building exists
    const building = await db.building.findUnique({
      where: { id: buildingId },
      select: { id: true, name: true, isActive: true },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    if (!building.isActive) {
      throw new Error('Cannot create music room for inactive building');
    }

    // VALIDATION: Validate required fields
    const { name, floor, capacity, instruments } = roomData;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Music room name is required');
    }

    if (name.trim().length > 100) {
      throw new Error('Music room name must be 100 characters or less');
    }

    // Validate capacity if provided
    if (capacity !== undefined && capacity !== null) {
      const capacityNum = parseInt(capacity);
      if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 1000) {
        throw new Error('Capacity must be between 1 and 1000');
      }
    }

    // Validate instruments if provided
    if (instruments && !Array.isArray(instruments)) {
      throw new Error('Instruments must be an array');
    }

    const musicRoom = await db.musicRoom.create({
      data: {
        buildingId,
        name: name.trim(),
        floor: floor || null,
        capacity: capacity ? parseInt(capacity) : 10,
        instruments: instruments || [],
      },
      include: {
        building: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return musicRoom;
  }

  // Update music room
  async updateMusicRoom(roomId, updates) {
    const musicRoom = await db.musicRoom.update({
      where: { id: roomId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        building: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return musicRoom;
  }

  // Delete music room (soft delete)
  async deleteMusicRoom(roomId) {
    const musicRoom = await db.musicRoom.update({
      where: { id: roomId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return musicRoom;
  }

  // Search music rooms by instrument or location
  async searchMusicRooms(query = '', instrument = null, city = null) {
    // FIX: Restructure query to prevent OR clause from bypassing building filters
    const where = {
      isActive: true,
      building: {
        isActive: true,
        approvalStatus: 'ACTIVE',
      },
    };

    // Build AND conditions array for proper filtering
    const andConditions = [];

    // Add search query conditions
    if (query && query.trim()) {
      andConditions.push({
        OR: [
          { name: { contains: query.trim(), mode: 'insensitive' } },
          { building: { name: { contains: query.trim(), mode: 'insensitive' } } },
          { building: { address: { contains: query.trim(), mode: 'insensitive' } } },
        ],
      });
    }

    // Add instrument filter
    if (instrument) {
      andConditions.push({
        instruments: { has: instrument },
      });
    }

    // Add city filter to building conditions (not as separate AND)
    if (city) {
      where.building.city = { contains: city.trim(), mode: 'insensitive' };
    }

    // Apply AND conditions if any exist
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const musicRooms = await db.musicRoom.findMany({
      where,
      include: {
        building: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            contactPhone: true,
            latitude: true,
            longitude: true,
            isActive: true,
            approvalStatus: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return musicRooms;
  }

  // Get nearby music rooms
  async getNearbyMusicRooms(latitude, longitude, radiusKm = 10) {
    // Simple distance calculation using Haversine formula approximation
    const latDelta = radiusKm / 111; // 1 degree latitude ≈ 111 km
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    const musicRooms = await db.musicRoom.findMany({
      where: {
        isActive: true,
        building: {
          isActive: true,
          approvalStatus: 'ACTIVE',
          latitude: {
            gte: latitude - latDelta,
            lte: latitude + latDelta,
          },
          longitude: {
            gte: longitude - lngDelta,
            lte: longitude + lngDelta,
          },
        },
      },
      include: {
        building: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            contactPhone: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return musicRooms;
  }
}

export default new MusicRoomService();