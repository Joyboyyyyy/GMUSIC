import db from '../lib/db.js';

// Supabase storage URL helper
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const COURSE_VIDEOS_BUCKET = 'course-videos';

/**
 * Generate public URL for a file in Supabase storage
 * @param {string} filePath - The file path in the bucket (e.g., "course-id/video.mp4")
 * @returns {string} Full public URL
 */
function getStorageUrl(filePath) {
  if (!filePath) return null;
  // If it's already a full URL, return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  // Generate Supabase storage public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${COURSE_VIDEOS_BUCKET}/${filePath}`;
}

class CourseService {
  async getAllCourses(filters = {}) {
    const { category, level, search, buildingId, instrument, publicOnly } = filters;

    // Build where clause
    const where = { 
      isActive: true,
      deletedAt: null,
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (buildingId) {
      // User has a specific building - show only that building's courses
      where.buildingId = buildingId;
    } else if (publicOnly !== false) {
      // No buildingId - show only courses from PUBLIC buildings
      where.building = {
        visibilityType: 'PUBLIC',
        approvalStatus: 'ACTIVE',
        isActive: true,
      };
    }

    if (instrument) {
      where.instrument = instrument;
    }

    // Only select columns that exist in the database
    const courses = await db.course.findMany({
      where,
      select: {
        id: true,
        buildingId: true,
        musicRoomId: true,
        name: true,
        description: true,
        instrument: true,
        previewVideoUrl: true,
        pricePerSlot: true,
        currency: true,
        durationMinutes: true,
        maxStudentsPerSlot: true,
        startDate: true,
        endDate: true,
        defaultStartTime: true,
        defaultEndTime: true,
        daysOfWeek: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        building: {
          select: { id: true, name: true, city: true, visibilityType: true },
        },
        // Include timeSlots to get teacher information
        timeSlots: {
          where: { isActive: true },
          take: 1, // Just need one slot to get the teacher
          select: {
            teacherId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch teacher assignments for all courses (building + instrument combinations)
    const teacherAssignments = await db.teacherAssignment.findMany({
      where: {
        buildingId: { in: courses.map(c => c.buildingId) },
      },
      select: {
        buildingId: true,
        authorizedInstruments: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    // Create teacher assignment lookup: buildingId + instrument -> teacher
    const teacherAssignmentMap = new Map();
    teacherAssignments.forEach(ta => {
      ta.authorizedInstruments.forEach(instrument => {
        const key = `${ta.buildingId}-${instrument}`;
        teacherAssignmentMap.set(key, ta.teacher);
      });
    });

    // Fetch all unique teacher IDs from timeslots
    const teacherIds = [...new Set(
      courses
        .flatMap(c => c.timeSlots.map(ts => ts.teacherId))
        .filter(Boolean)
    )];

    console.log('[CourseService] Found teacher IDs from timeslots:', teacherIds);

    // Fetch teacher details from timeslots
    const teachers = await db.user.findMany({
      where: {
        id: { in: teacherIds },
        role: 'TEACHER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
      },
    });

    console.log('[CourseService] Fetched teachers from timeslots:', teachers.map(t => ({ id: t.id, name: t.name })));

    // Create teacher lookup map from timeslots
    const teacherMap = new Map(teachers.map(t => [t.id, t]));

    // Transform to match frontend MusicPack format for compatibility
    return courses.map(course => {
      // Priority 1: Get teacher from TeacherAssignment (building + instrument)
      const assignmentKey = `${course.buildingId}-${course.instrument}`;
      let teacher = teacherAssignmentMap.get(assignmentKey);
      
      // Priority 2: Get teacher from first timeslot
      if (!teacher) {
        const teacherId = course.timeSlots?.[0]?.teacherId;
        teacher = teacherId ? teacherMap.get(teacherId) : null;
      }
      
      console.log(`[CourseService] Course "${course.name}" (${course.instrument}): teacher=${teacher?.name || 'none'} (from ${teacherAssignmentMap.has(assignmentKey) ? 'TeacherAssignment' : 'TimeSlot'})`);
      
      return {
        ...course,
        // Use name as title for frontend compatibility
        title: course.name || 'Untitled Course',
        // Map to MusicPack format for frontend compatibility
        // Generate video URL from Supabase storage if previewVideoUrl is a path
        videoUrl: getStorageUrl(course.previewVideoUrl),
        thumbnailUrl: course.previewVideoUrl 
          ? getStorageUrl(course.previewVideoUrl) 
          : 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
        // Use actual teacher data if available, otherwise fallback to building name
        teacher: teacher ? {
          id: teacher.id,
          name: teacher.name,
          bio: '',
          avatarUrl: teacher.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=7c3aed&color=fff`,
          rating: 4.5,
          students: 0,
        } : {
          id: `building-${course.buildingId}`,
          name: course.building?.name || 'Gretex Music Room',
          bio: '',
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(course.building?.name || 'Gretex')}&background=7c3aed&color=fff`,
          rating: 4.5,
          students: 0,
        },
        category: course.instrument || 'Other',
        rating: 4.5,
        studentsCount: 0,
        tracksCount: 0,
        duration: course.durationMinutes || 60,
        level: 'Beginner',
        price: course.pricePerSlot || 0,
      };
    });
  }

  async getCourseById(courseId) {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        buildingId: true,
        musicRoomId: true,
        name: true,
        description: true,
        instrument: true,
        previewVideoUrl: true,
        pricePerSlot: true,
        currency: true,
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
          take: 20,
          select: {
            id: true,
            slotDate: true,
            startTime: true,
            endTime: true,
            maxCapacity: true,
            currentEnrollment: true,
            status: true,
            teacherId: true,
          },
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Get instructor from TeacherAssignment for this building and instrument
    let instructor = null;
    try {
      const teacherAssignment = await db.teacherAssignment.findFirst({
        where: {
          buildingId: course.buildingId,
          isActive: true,
          authorizedInstruments: { has: course.instrument },
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              bio: true,
              avatar: true,
              profilePicture: true,
              yearsOfExperience: true,
              specializations: true,
            },
          },
        },
      });

      if (teacherAssignment?.teacher) {
        instructor = teacherAssignment.teacher;
      }
    } catch (err) {
      console.warn('Could not fetch teacher assignment:', err.message);
    }

    // If no teacher assignment, try to get from timeSlot teacherId
    if (!instructor && course.timeSlots?.length > 0) {
      const slotWithTeacher = course.timeSlots.find(s => s.teacherId);
      if (slotWithTeacher?.teacherId) {
        try {
          instructor = await db.user.findUnique({
            where: { id: slotWithTeacher.teacherId },
            select: {
              id: true,
              name: true,
              bio: true,
              avatar: true,
              profilePicture: true,
              yearsOfExperience: true,
              specializations: true,
            },
          });
        } catch (err) {
          console.warn('Could not fetch slot teacher:', err.message);
        }
      }
    }

    // Count total students enrolled in this course
    let studentsCount = 0;
    try {
      studentsCount = await db.slotEnrollment.count({
        where: {
          slot: { courseId: courseId },
          status: 'CONFIRMED',
        },
      });
    } catch (err) {
      console.warn('Could not count students:', err.message);
    }

    // Get average rating for instructor if available
    let instructorRating = 4.5;
    let instructorStudents = 0;
    if (instructor?.id) {
      try {
        const ratingData = await db.teacherRating.aggregate({
          where: { teacherId: instructor.id },
          _avg: { rating: true },
          _count: { rating: true },
        });
        if (ratingData._avg.rating) {
          instructorRating = Math.round(ratingData._avg.rating * 10) / 10;
        }
        // Count unique students taught by this teacher
        const studentCount = await db.slotEnrollment.count({
          where: {
            slot: { teacherId: instructor.id },
            status: 'CONFIRMED',
          },
        });
        instructorStudents = studentCount;
      } catch (err) {
        console.warn('Could not fetch teacher rating:', err.message);
      }
    }

    // Build teacher object
    const teacherName = instructor?.name || course.building?.name || 'Gretex Music Room';
    const teacher = {
      id: instructor?.id || 'default',
      name: teacherName,
      bio: instructor?.bio || `Professional ${course.instrument?.toLowerCase() || 'music'} instructor`,
      avatarUrl: instructor?.profilePicture || instructor?.avatar || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=7c3aed&color=fff`,
      rating: instructorRating,
      students: instructorStudents,
      yearsOfExperience: instructor?.yearsOfExperience || null,
      specializations: instructor?.specializations || [],
    };

    // Transform to match frontend format
    return {
      ...course,
      title: course.name || 'Untitled Course',
      videoUrl: getStorageUrl(course.previewVideoUrl),
      thumbnailUrl: course.previewVideoUrl 
        ? getStorageUrl(course.previewVideoUrl) 
        : 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
      teacher,
      category: course.instrument || 'Other',
      rating: 4.5,
      studentsCount,
      tracksCount: course.timeSlots?.length || 0,
      duration: course.durationMinutes || 60,
      level: 'Beginner',
      price: course.pricePerSlot || 0,
    };
  }

  async getUserCourses(userId) {
    console.log(`\n========================================`);
    console.log(`[CourseService] 🔍 DEBUG: Getting purchased courses for user: ${userId}`);
    console.log(`[CourseService] 🕐 Timestamp: ${new Date().toISOString()}`);
    console.log(`========================================\n`);
    
    // Get unique courses from enrollments
    const coursesMap = new Map();
    
    // Method 1: Get user's slot enrollments and their associated courses
    console.log(`[CourseService] 📋 METHOD 1: Checking SlotEnrollments...`);
    try {
      const slotEnrollments = await db.slotEnrollment.findMany({
        where: { 
          studentId: userId,
          status: 'CONFIRMED',
        },
        include: {
          slot: {
            include: {
              course: {
                select: {
                  id: true,
                  buildingId: true,
                  name: true,
                  description: true,
                  instrument: true,
                  previewVideoUrl: true,
                  pricePerSlot: true,
                  durationMinutes: true,
                  createdAt: true,
                  building: {
                    select: { id: true, name: true, city: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`[CourseService] ✅ Found ${slotEnrollments.length} slot enrollments`);
      
      for (const enrollment of slotEnrollments) {
        const course = enrollment.slot?.course;
        if (course && !coursesMap.has(course.id)) {
          console.log(`[CourseService]   ➕ Adding course from enrollment: ${course.name} (ID: ${course.id})`);
          coursesMap.set(course.id, this._transformCourseForFrontend(course, enrollment.createdAt));
        }
      }
    } catch (err) {
      console.error('[CourseService] ❌ Error fetching slot enrollments:', err.message);
      console.error('[CourseService] Stack:', err.stack);
    }

    // Method 2: Get courses from completed payments (via Razorpay order notes)
    console.log(`\n[CourseService] 💳 METHOD 2: Checking Completed Payments...`);
    try {
      const completedPayments = await db.payment.findMany({
        where: {
          studentId: userId,
          status: 'COMPLETED',
        },
        orderBy: { completedAt: 'desc' },
      });
      
      console.log(`[CourseService] ✅ Found ${completedPayments.length} completed payments`);
      
      if (completedPayments.length > 0) {
        console.log(`[CourseService] 📝 Payment details:`);
        completedPayments.forEach((payment, index) => {
          console.log(`[CourseService]   Payment ${index + 1}:`);
          console.log(`[CourseService]     - ID: ${payment.id}`);
          console.log(`[CourseService]     - Amount: ₹${payment.amount}`);
          console.log(`[CourseService]     - Gateway Order ID: ${payment.gatewayOrderId}`);
          console.log(`[CourseService]     - Completed At: ${payment.completedAt}`);
        });
      }

      // For each payment, try to find the course from the Razorpay order notes
      for (let i = 0; i < completedPayments.length; i++) {
        const payment = completedPayments[i];
        console.log(`\n[CourseService] 🔄 Processing payment ${i + 1}/${completedPayments.length}...`);
        console.log(`[CourseService]   Payment ID: ${payment.id}`);
        console.log(`[CourseService]   Gateway Order ID: ${payment.gatewayOrderId}`);
        
        if (!payment.gatewayOrderId) {
          console.log(`[CourseService]   ⚠️  No gateway order ID, skipping...`);
          continue;
        }
        
        try {
          // Try to get course info from Razorpay order notes
          console.log(`[CourseService]   📡 Fetching Razorpay order details...`);
          const { getRazorpay } = await import('../config/razorpay.js');
          const razorpay = getRazorpay();
          
          if (!razorpay) {
            console.log(`[CourseService]   ❌ Razorpay not configured`);
            continue;
          }
          
          const order = await razorpay.orders.fetch(payment.gatewayOrderId);
          console.log(`[CourseService]   ✅ Order fetched successfully`);
          console.log(`[CourseService]   📋 Order notes:`, JSON.stringify(order.notes, null, 2));
          
          const courseId = order.notes?.courseId;
          console.log(`[CourseService]   🎯 Extracted courseId: ${courseId}`);
          
          if (!courseId) {
            console.log(`[CourseService]   ⚠️  No courseId in order notes, skipping...`);
            continue;
          }
          
          if (coursesMap.has(courseId)) {
            console.log(`[CourseService]   ℹ️  Course already in map, skipping...`);
            continue;
          }
          
          console.log(`[CourseService]   🔍 Fetching course from database...`);
          const course = await db.course.findUnique({
            where: { id: courseId },
            select: {
              id: true,
              buildingId: true,
              name: true,
              description: true,
              instrument: true,
              previewVideoUrl: true,
              pricePerSlot: true,
              durationMinutes: true,
              createdAt: true,
              building: {
                select: { id: true, name: true, city: true },
              },
            },
          });
          
          if (course) {
            console.log(`[CourseService]   ✅ Course found: ${course.name} (ID: ${course.id})`);
            coursesMap.set(course.id, this._transformCourseForFrontend(course, payment.completedAt || payment.createdAt));
            console.log(`[CourseService]   ➕ Added course to map`);
          } else {
            console.log(`[CourseService]   ❌ Course not found in database for ID: ${courseId}`);
          }
        } catch (orderErr) {
          console.error(`[CourseService]   ❌ Error processing payment ${payment.gatewayOrderId}:`, orderErr.message);
          console.error(`[CourseService]   Stack:`, orderErr.stack);
        }
      }
    } catch (err) {
      console.error('[CourseService] ❌ Error fetching payments:', err.message);
      console.error('[CourseService] Stack:', err.stack);
    }

    const courses = Array.from(coursesMap.values());
    console.log(`\n========================================`);
    console.log(`[CourseService] 🎉 FINAL RESULT: ${courses.length} purchased courses`);
    if (courses.length > 0) {
      console.log(`[CourseService] 📚 Courses:`);
      courses.forEach((course, index) => {
        console.log(`[CourseService]   ${index + 1}. ${course.title} (ID: ${course.id})`);
      });
    } else {
      console.log(`[CourseService] ⚠️  No purchased courses found for user ${userId}`);
    }
    console.log(`========================================\n`);
    
    return courses;
  }

  _transformCourseForFrontend(course, enrolledAt) {
    return {
      ...course,
      title: course.name || 'Untitled Course',
      enrolledAt: enrolledAt,
      thumbnailUrl: course.previewVideoUrl || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
      category: course.instrument || 'Other',
      duration: course.durationMinutes || 60,
      price: course.pricePerSlot || 0,
      teacher: {
        id: 'default',
        name: course.building?.name || 'Gretex Music Room',
        bio: '',
        avatarUrl: 'https://ui-avatars.com/api/?name=Gretex&background=7c3aed&color=fff',
        rating: 4.5,
        students: 0,
      },
      level: 'Beginner',
      rating: 4.5,
      studentsCount: 0,
      tracksCount: 0,
    };
  }

  async createCourse(courseData) {
    const course = await db.course.create({
      data: courseData,
    });

    return course;
  }

  async updateCourse(courseId, updates) {
    const course = await db.course.update({
      where: { id: courseId },
      data: updates,
    });

    return course;
  }

  async deleteCourse(courseId) {
    await db.course.delete({
      where: { id: courseId },
    });

    return { message: 'Course deleted successfully' };
  }

  async addTrackToCourse(courseId, trackData) {
    // Track model doesn't exist in current schema
    // This is a placeholder for future implementation
    throw new Error('Track functionality not yet implemented');
  }
}

export default new CourseService();

