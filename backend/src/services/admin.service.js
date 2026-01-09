import db from '../lib/db.js';
import crypto from 'crypto';

class AdminService {
  // ============================================
  // BUILDING MANAGEMENT
  // ============================================

  generateRegistrationCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  async createBuilding(data, adminId) {
    const {
      name, address, city, state, country, zipCode,
      latitude, longitude, residenceCount, musicRoomCount,
      contactPersonName, contactEmail, contactPhone,
      visibilityType = 'PUBLIC'
    } = data;

    const building = await db.building.create({
      data: {
        name,
        registrationCode: this.generateRegistrationCode(),
        address,
        city,
        state,
        country,
        zipCode,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        residenceCount: parseInt(residenceCount) || 0,
        musicRoomCount: parseInt(musicRoomCount) || 1,
        contactPersonName,
        contactEmail,
        contactPhone,
        visibilityType,
        approvalStatus: 'ACTIVE', // Admin-created buildings are auto-approved
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    console.log(`[Admin] Building created: ${building.id} - ${building.name}`);
    return building;
  }

  async updateBuilding(id, data, adminId) {
    const building = await db.building.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    console.log(`[Admin] Building updated: ${building.id}`);
    return building;
  }

  async deleteBuilding(id) {
    // Soft delete
    const building = await db.building.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    console.log(`[Admin] Building soft-deleted: ${id}`);
    return building;
  }

  async getAllBuildings() {
    return db.building.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { courses: true, users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }


  // ============================================
  // COURSE MANAGEMENT
  // ============================================

  async createCourse(data, adminId) {
    const {
      buildingId,
      title,
      name,
      description,
      instrument,
      price,
      pricePerSlot,
      maxStudentsPerSlot = 1,
      durationMinutes = 60,
      startDate,
      endDate,
      defaultStartTime = '09:00',
      defaultEndTime = '10:00',
      daysOfWeek = [1, 2, 3, 4, 5], // Mon-Fri default
      previewVideoUrl,
    } = data;

    // Validate building exists
    if (buildingId) {
      const building = await db.building.findUnique({ where: { id: buildingId } });
      if (!building) {
        throw new Error('Building not found');
      }
    }

    // Use name as primary, fall back to title
    const courseName = name || title || 'Untitled Course';

    const course = await db.course.create({
      data: {
        buildingId: buildingId || null,
        name: courseName,
        description,
        instrument: instrument || 'OTHER',
        pricePerSlot: parseFloat(pricePerSlot) || parseFloat(price) || 0,
        durationMinutes: parseInt(durationMinutes) || 60,
        maxStudentsPerSlot: parseInt(maxStudentsPerSlot) || 1,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
        defaultStartTime,
        defaultEndTime,
        daysOfWeek: daysOfWeek.map(d => parseInt(d)),
        previewVideoUrl,
        currency: 'INR',
        isActive: true,
      },
      select: {
        id: true,
        buildingId: true,
        name: true,
        description: true,
        instrument: true,
        pricePerSlot: true,
        durationMinutes: true,
        createdAt: true,
        building: { select: { id: true, name: true } },
      },
    });

    console.log(`[Admin] Course created: ${course.id} - ${course.name}`);
    return course;
  }

  async updateCourse(id, data, adminId) {
    const updateData = {};

    // Only update provided fields - use only columns that exist in database
    if (data.name !== undefined) updateData.name = data.name;
    if (data.title !== undefined) {
      // Map title to name since title column doesn't exist
      if (data.name === undefined) updateData.name = data.title;
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.instrument !== undefined) updateData.instrument = data.instrument;
    if (data.pricePerSlot !== undefined) updateData.pricePerSlot = parseFloat(data.pricePerSlot);
    if (data.price !== undefined && data.pricePerSlot === undefined) {
      updateData.pricePerSlot = parseFloat(data.price);
    }
    if (data.maxStudentsPerSlot !== undefined) updateData.maxStudentsPerSlot = parseInt(data.maxStudentsPerSlot);
    if (data.durationMinutes !== undefined) {
      updateData.durationMinutes = parseInt(data.durationMinutes);
    }
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.defaultStartTime !== undefined) updateData.defaultStartTime = data.defaultStartTime;
    if (data.defaultEndTime !== undefined) updateData.defaultEndTime = data.defaultEndTime;
    if (data.daysOfWeek !== undefined) updateData.daysOfWeek = data.daysOfWeek.map(d => parseInt(d));
    if (data.previewVideoUrl !== undefined) updateData.previewVideoUrl = data.previewVideoUrl;
    if (data.buildingId !== undefined) updateData.buildingId = data.buildingId;

    const course = await db.course.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        buildingId: true,
        name: true,
        description: true,
        instrument: true,
        pricePerSlot: true,
        durationMinutes: true,
        createdAt: true,
        building: { select: { id: true, name: true } },
      },
    });

    console.log(`[Admin] Course updated: ${course.id}`);
    return course;
  }

  async deleteCourse(id) {
    // Soft delete
    const course = await db.course.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    console.log(`[Admin] Course soft-deleted: ${id}`);
    return course;
  }

  async getAllCourses() {
    return db.course.findMany({
      where: { isActive: true },
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
        defaultStartTime: true,
        defaultEndTime: true,
        daysOfWeek: true,
        isActive: true,
        createdAt: true,
        building: { select: { id: true, name: true } },
        _count: { select: { timeSlots: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCourseById(id) {
    return db.course.findUnique({
      where: { id },
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
        defaultStartTime: true,
        defaultEndTime: true,
        daysOfWeek: true,
        isActive: true,
        createdAt: true,
        building: true,
        timeSlots: {
          where: { isActive: true },
          orderBy: { slotDate: 'asc' },
        },
      },
    });
  }

  // ============================================
  // USER BUILDING ACCESS MANAGEMENT
  // ============================================

  // Get users pending building approval
  async getPendingBuildingApprovals() {
    // Find users with PENDING_VERIFICATION status who have a building assigned
    // This covers both new flow (buildingId set) and legacy flow (REQUESTED_BUILDING: in rejectedReason)
    const users = await db.user.findMany({
      where: {
        approvalStatus: 'PENDING_VERIFICATION',
        isActive: true,
        OR: [
          { buildingId: { not: null } }, // New flow: buildingId already assigned
          { rejectedReason: { startsWith: 'REQUESTED_BUILDING:' } }, // Legacy flow
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        buildingId: true,
        governmentIdUrl: true,
        rejectedReason: true,
        createdAt: true,
        building: {
          select: {
            id: true,
            name: true,
            city: true,
            registrationCode: true,
            visibilityType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with building info for legacy flow users
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      // If user already has building relation, use it
      if (user.building) {
        return {
          ...user,
          requestedBuildingId: user.buildingId,
          requestedBuilding: user.building,
          proofDocumentUrl: user.governmentIdUrl,
        };
      }
      
      // Legacy flow: parse building ID from rejectedReason
      const requestedBuildingId = user.rejectedReason?.replace('REQUESTED_BUILDING:', '');
      let building = null;
      
      if (requestedBuildingId) {
        building = await db.building.findUnique({
          where: { id: requestedBuildingId },
          select: { id: true, name: true, city: true, registrationCode: true, visibilityType: true },
        });
      }
      
      return {
        ...user,
        requestedBuildingId,
        requestedBuilding: building,
        proofDocumentUrl: user.governmentIdUrl,
      };
    }));

    return enrichedUsers;
  }

  // Approve user building access
  async approveBuildingAccess(userId, adminId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        buildingId: true,
        rejectedReason: true,
        approvalStatus: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has a buildingId (new flow) or needs to extract from rejectedReason (legacy)
    let targetBuildingId = user.buildingId;
    
    // Legacy flow: Extract requested building ID from rejectedReason
    if (!targetBuildingId && user.rejectedReason?.startsWith('REQUESTED_BUILDING:')) {
      targetBuildingId = user.rejectedReason.replace('REQUESTED_BUILDING:', '');
    }

    if (!targetBuildingId) {
      throw new Error('User has no pending building request');
    }

    // Verify building exists
    const building = await db.building.findUnique({
      where: { id: targetBuildingId },
      select: { id: true, name: true },
    });

    if (!building) {
      throw new Error('Requested building not found');
    }

    // Update user: ensure building is assigned, set status to ACTIVE
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        buildingId: targetBuildingId,
        approvalStatus: 'ACTIVE',
        rejectedReason: null, // Clear any legacy field
        approvedBy: adminId,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        buildingId: true,
        approvalStatus: true,
        building: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`[Admin] Building access approved for user ${userId} to building ${building.name}`);
    
    // Send notification to user
    try {
      const notificationService = (await import('./notification.service.js')).default;
      await notificationService.notifyUserBuildingApproved(userId, building.name);
    } catch (notifError) {
      console.error('[Admin] Failed to send approval notification:', notifError);
    }
    
    return { user: updatedUser, building };
  }

  // Reject user building access
  async rejectBuildingAccess(userId, adminId, reason) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        rejectedReason: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update user: reject and clear pending status
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        approvalStatus: 'REJECTED',
        rejectedReason: reason || 'Building access request rejected',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        approvalStatus: true,
        rejectedReason: true,
      },
    });

    console.log(`[Admin] Building access rejected for user ${userId}: ${reason}`);
    return updatedUser;
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  // Get all users with filters
  async getAllUsers(filters = {}) {
    const { role, approvalStatus, isActive = true, buildingId } = filters;
    
    const where = { isActive, deletedAt: null };
    if (role) where.role = role;
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (buildingId) where.buildingId = buildingId;

    return db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        buildingId: true,
        academyId: true,
        approvalStatus: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        building: { select: { id: true, name: true } },
        academy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get single user details
  async getUserById(userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        profilePicture: true,
        role: true,
        bio: true,
        dateOfBirth: true,
        buildingId: true,
        academyId: true,
        specializations: true,
        yearsOfExperience: true,
        governmentIdUrl: true,
        resumeUrl: true,
        certificatesUrl: true,
        latitude: true,
        longitude: true,
        approvalStatus: true,
        approvedBy: true,
        approvedAt: true,
        rejectedReason: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        building: { select: { id: true, name: true, address: true } },
        academy: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Update user role
  async updateUserRole(userId, newRole, adminId) {
    const validRoles = ['STUDENT', 'TEACHER', 'BUILDING_ADMIN', 'ACADEMY_ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`[Admin] User ${userId} role updated to ${newRole} by ${adminId}`);
    return user;
  }

  // Soft delete user (deactivate)
  async deactivateUser(userId, adminId) {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        deletedAt: true,
      },
    });

    console.log(`[Admin] User ${userId} deactivated by ${adminId}`);
    return user;
  }

  // Reactivate user
  async reactivateUser(userId, adminId) {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    console.log(`[Admin] User ${userId} reactivated by ${adminId}`);
    return user;
  }

  // Block user
  async blockUser(userId, adminId, reason) {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        approvalStatus: 'BLOCKED',
        rejectedReason: reason || 'Account blocked by administrator',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        approvalStatus: true,
        rejectedReason: true,
      },
    });

    console.log(`[Admin] User ${userId} blocked by ${adminId}: ${reason}`);
    return user;
  }

  // Unblock user
  async unblockUser(userId, adminId) {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        approvalStatus: 'ACTIVE',
        rejectedReason: null,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        approvalStatus: true,
      },
    });

    console.log(`[Admin] User ${userId} unblocked by ${adminId}`);
    return user;
  }

  // Approve user (for pending verification)
  async approveUser(userId, adminId) {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        approvalStatus: 'ACTIVE',
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectedReason: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        approvalStatus: true,
        approvedAt: true,
      },
    });

    console.log(`[Admin] User ${userId} approved by ${adminId}`);
    return user;
  }

  // Reject user
  async rejectUser(userId, adminId, reason) {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        approvalStatus: 'REJECTED',
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectedReason: reason || 'Application rejected',
      },
      select: {
        id: true,
        email: true,
        name: true,
        approvalStatus: true,
        rejectedReason: true,
      },
    });

    console.log(`[Admin] User ${userId} rejected by ${adminId}: ${reason}`);
    return user;
  }

  // Suspend user temporarily
  async suspendUser(userId, adminId, reason) {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        approvalStatus: 'SUSPENDED',
        rejectedReason: reason || 'Account suspended',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        approvalStatus: true,
        rejectedReason: true,
      },
    });

    console.log(`[Admin] User ${userId} suspended by ${adminId}: ${reason}`);
    return user;
  }

  // Assign user to building
  async assignUserToBuilding(userId, buildingId, adminId) {
    // Verify building exists
    const building = await db.building.findUnique({
      where: { id: buildingId },
      select: { id: true, name: true },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        buildingId: buildingId,
        approvalStatus: 'ACTIVE',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        buildingId: true,
        building: { select: { id: true, name: true } },
      },
    });

    console.log(`[Admin] User ${userId} assigned to building ${building.name} by ${adminId}`);
    return user;
  }

  // Assign user to academy (for teachers)
  async assignUserToAcademy(userId, academyId, adminId) {
    // Verify academy exists
    const academy = await db.musicAcademy.findUnique({
      where: { id: academyId },
      select: { id: true, name: true },
    });

    if (!academy) {
      throw new Error('Academy not found');
    }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        academyId: academyId,
        role: 'TEACHER', // Auto-assign teacher role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        academyId: true,
        academy: { select: { id: true, name: true } },
      },
    });

    console.log(`[Admin] User ${userId} assigned to academy ${academy.name} by ${adminId}`);
    return user;
  }
}

export default new AdminService();
