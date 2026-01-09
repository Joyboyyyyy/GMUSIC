import db from '../lib/db.js';
import crypto from 'crypto';

class BuildingService {
  // Generate unique 8-character registration code
  generateRegistrationCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  // Search buildings by name or city
  async searchBuildings(query = '', limit = 20) {
    const where = {
      isActive: true,
      approvalStatus: 'ACTIVE',
    };

    if (query && query.trim()) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
      ];
    }

    const buildings = await db.building.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        state: true,
        latitude: true,
        longitude: true,
        visibilityType: true,
        musicRoomCount: true,
        contactPhone: true,
        _count: { select: { courses: true } },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return buildings.map(b => ({
      id: b.id,
      name: b.name,
      city: b.city,
      address: b.address,
      state: b.state,
      latitude: b.latitude,
      longitude: b.longitude,
      visibilityType: b.visibilityType,
      musicRoomCount: b.musicRoomCount,
      contactPhone: b.contactPhone,
      courseCount: b._count.courses,
    }));
  }

  async createBuilding(buildingData, userId) {
    const {
      name, address, city, state, country, zipCode,
      latitude, longitude, residenceCount, musicRoomCount,
      contactPersonName, contactEmail, contactPhone,
      visibilityType = 'PRIVATE'
    } = buildingData;

    const registrationCode = this.generateRegistrationCode();

    const building = await db.building.create({
      data: {
        name,
        registrationCode,
        address,
        city,
        state,
        country,
        zipCode,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        residenceCount: parseInt(residenceCount),
        musicRoomCount: parseInt(musicRoomCount),
        contactPersonName,
        contactEmail,
        contactPhone,
        visibilityType,
        approvalStatus: 'PENDING_VERIFICATION',
      },
    });

    return building;
  }

  async getBuildings(filters = {}) {
    const { visibilityType, approvalStatus, isActive = true } = filters;

    const where = { isActive };
    
    if (visibilityType) where.visibilityType = visibilityType;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const buildings = await db.building.findMany({
      where,
      include: {
        musicRooms: { where: { isActive: true } },
        _count: { select: { courses: true, users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return buildings;
  }

  async getPublicBuildings() {
    const buildings = await db.building.findMany({
      where: {
        isActive: true,
        visibilityType: 'PUBLIC',
        approvalStatus: 'ACTIVE',
      },
      include: {
        courses: {
          where: { 
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            buildingId: true,
            name: true,
            description: true,
            instrument: true,
            previewVideoUrl: true,
            pricePerSlot: true,
            durationMinutes: true,
            maxStudentsPerSlot: true,
            startDate: true,
            endDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        musicRooms: { where: { isActive: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Transform courses to include title field for frontend compatibility
    return buildings.map(building => ({
      ...building,
      courses: building.courses.map(course => ({
        ...course,
        title: course.name || 'Untitled Course',
        price: course.pricePerSlot || 0,
        duration: course.durationMinutes || 60,
      })),
    }));
  }

  async getBuildingById(id) {
    const building = await db.building.findUnique({
      where: { id },
      include: {
        musicRooms: { where: { isActive: true } },
        courses: { where: { isActive: true } },
        _count: { select: { users: true } },
      },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    return building;
  }

  async getBuildingByCode(registrationCode) {
    const building = await db.building.findUnique({
      where: { registrationCode },
    });

    if (!building) {
      throw new Error('Invalid building code');
    }

    return building;
  }

  async updateBuilding(id, updates, userId) {
    const building = await db.building.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return building;
  }

  async approveBuilding(id, approvedBy) {
    const building = await db.building.update({
      where: { id },
      data: {
        approvalStatus: 'ACTIVE',
        approvedBy,
        approvedAt: new Date(),
      },
    });

    return building;
  }

  async rejectBuilding(id, approvedBy, reason) {
    const building = await db.building.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        approvedBy,
        approvedAt: new Date(),
        rejectedReason: reason,
      },
    });

    return building;
  }

  async getNearbyBuildings(latitude, longitude, radiusKm = 10) {
    // Simple distance calculation using Haversine formula approximation
    const latDelta = radiusKm / 111; // 1 degree latitude ≈ 111 km
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    const buildings = await db.building.findMany({
      where: {
        isActive: true,
        approvalStatus: 'ACTIVE',
        visibilityType: 'PUBLIC',
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - lngDelta,
          lte: longitude + lngDelta,
        },
      },
      include: {
        _count: { select: { courses: true } },
      },
    });

    return buildings;
  }

  // Get buildings that have music rooms available for booking
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
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        state: true,
        latitude: true,
        longitude: true,
        visibilityType: true,
        musicRoomCount: true,
        contactPhone: true,
        _count: { 
          select: { 
            musicRooms: { where: { isActive: true } },
            courses: true,
          } 
        },
      },
      orderBy: { name: 'asc' },
    });

    return buildings.map(b => ({
      id: b.id,
      name: b.name,
      city: b.city,
      address: b.address,
      state: b.state,
      latitude: b.latitude,
      longitude: b.longitude,
      visibilityType: b.visibilityType,
      musicRoomCount: b._count.musicRooms || b.musicRoomCount,
      contactPhone: b.contactPhone,
      courseCount: b._count.courses,
      isActive: true,
    }));
  }

  // Get building with courses for user's building
  async getBuildingWithCourses(buildingId) {
    const building = await db.building.findUnique({
      where: { id: buildingId },
      include: {
        courses: {
          where: { 
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            buildingId: true,
            name: true,
            description: true,
            instrument: true,
            previewVideoUrl: true,
            pricePerSlot: true,
            durationMinutes: true,
            maxStudentsPerSlot: true,
            startDate: true,
            endDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        musicRooms: { where: { isActive: true } },
      },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    return building;
  }

  // Get courses for a specific building
  async getBuildingCourses(buildingId) {
    const courses = await db.course.findMany({
      where: {
        buildingId: buildingId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        buildingId: true,
        name: true,
        description: true,
        instrument: true,
        previewVideoUrl: true,
        pricePerSlot: true,
        durationMinutes: true,
        maxStudentsPerSlot: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        building: {
          select: { id: true, name: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match frontend format
    return courses.map(course => ({
      ...course,
      title: course.name || 'Untitled Course',
      thumbnailUrl: course.previewVideoUrl || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
      category: course.instrument || 'Other',
      duration: course.durationMinutes || 60,
      price: course.pricePerSlot || 0,
    }));
  }

  // Get user's building info with approval status
  async getUserBuilding(userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        buildingId: true,
        approvalStatus: true,
        rejectedReason: true,
        requestedBuildingId: true,
        buildingApprovalStatus: true,
        buildingRejectedReason: true,
        building: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            registrationCode: true,
          },
        },
        requestedBuilding: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });

    return user;
  }

  // Get all buildings for browsing (public + private)
  async getAllBuildingsForBrowsing() {
    const buildings = await db.building.findMany({
      where: {
        isActive: true,
        approvalStatus: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        state: true,
        latitude: true,
        longitude: true,
        visibilityType: true,
        musicRoomCount: true,
        contactPhone: true,
        _count: { select: { courses: true, users: true } },
      },
      orderBy: { name: 'asc' },
    });

    return buildings.map(b => ({
      id: b.id,
      name: b.name,
      city: b.city,
      address: b.address,
      state: b.state,
      latitude: b.latitude,
      longitude: b.longitude,
      visibilityType: b.visibilityType,
      musicRoomCount: b.musicRoomCount,
      contactPhone: b.contactPhone,
      courseCount: b._count.courses,
      userCount: b._count.users,
    }));
  }

  // Request access to a private building
  async requestBuildingAccess(userId, buildingId, residenceData = {}) {
    // Check if building exists and is private
    const building = await db.building.findUnique({
      where: { id: buildingId },
      select: {
        id: true,
        name: true,
        visibilityType: true,
        approvalStatus: true,
      },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    if (building.approvalStatus !== 'ACTIVE') {
      throw new Error('Building is not active');
    }

    // Check if user already has a pending request or is already a member
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        buildingId: true,
        requestedBuildingId: true,
        buildingApprovalStatus: true,
      },
    });

    if (user.buildingId === buildingId) {
      throw new Error('You are already a member of this building');
    }

    if (user.requestedBuildingId === buildingId && user.buildingApprovalStatus === 'PENDING_VERIFICATION') {
      throw new Error('You already have a pending request for this building');
    }

    // Update user with building access request
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        requestedBuildingId: buildingId,
        buildingApprovalStatus: 'PENDING_VERIFICATION',
        buildingRejectedReason: null,
        residenceAddress: residenceData.residenceAddress || null,
        residenceFlatNo: residenceData.residenceFlatNo || null,
        residenceFloor: residenceData.residenceFloor || null,
        residenceProofType: residenceData.residenceProofType || null,
        residenceProofUrl: residenceData.residenceProofUrl || null,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: building.visibilityType === 'PRIVATE' 
        ? 'Access request submitted. Awaiting building admin approval.'
        : 'Access request submitted.',
      buildingName: building.name,
    };
  }

  // Get pending building access requests (for building admins)
  async getPendingBuildingAccessRequests(buildingId) {
    const requests = await db.user.findMany({
      where: {
        requestedBuildingId: buildingId,
        buildingApprovalStatus: 'PENDING_VERIFICATION',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        residenceAddress: true,
        residenceFlatNo: true,
        residenceFloor: true,
        residenceProofType: true,
        residenceProofUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  // Approve building access request
  async approveBuildingAccessRequest(userId, approvedById) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        requestedBuildingId: true,
        buildingApprovalStatus: true,
      },
    });

    if (!user || !user.requestedBuildingId) {
      throw new Error('No pending building access request found');
    }

    if (user.buildingApprovalStatus !== 'PENDING_VERIFICATION') {
      throw new Error('Request is not pending');
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        buildingId: user.requestedBuildingId,
        buildingApprovalStatus: 'ACTIVE',
        buildingApprovedAt: new Date(),
        buildingApprovedBy: approvedById,
        approvalStatus: 'ACTIVE', // Also activate user if pending
        requestedBuildingId: null, // Clear the request
        updatedAt: new Date(),
      },
    });

    return updatedUser;
  }

  // Reject building access request
  async rejectBuildingAccessRequest(userId, rejectedById, reason) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        requestedBuildingId: true,
        buildingApprovalStatus: true,
      },
    });

    if (!user || !user.requestedBuildingId) {
      throw new Error('No pending building access request found');
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        buildingApprovalStatus: 'REJECTED',
        buildingRejectedReason: reason || 'Request rejected by building admin',
        requestedBuildingId: null, // Clear the request
        updatedAt: new Date(),
      },
    });

    return updatedUser;
  }
}


export default new BuildingService();
