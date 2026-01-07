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
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match frontend MusicPack format for compatibility
    return courses.map(course => ({
      ...course,
      // Use name as title for frontend compatibility
      title: course.name || 'Untitled Course',
      // Map to MusicPack format for frontend compatibility
      // Generate video URL from Supabase storage if previewVideoUrl is a path
      videoUrl: getStorageUrl(course.previewVideoUrl),
      thumbnailUrl: course.previewVideoUrl 
        ? getStorageUrl(course.previewVideoUrl) 
        : 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
      teacher: {
        id: 'default',
        name: course.building?.name || 'Gretex Music Room',
        bio: '',
        avatarUrl: 'https://ui-avatars.com/api/?name=Gretex&background=7c3aed&color=fff',
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
    }));
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
    // Get user's slot enrollments and their associated courses
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

    // Get unique courses from enrollments
    const coursesMap = new Map();
    for (const enrollment of slotEnrollments) {
      const course = enrollment.slot?.course;
      if (course && !coursesMap.has(course.id)) {
        coursesMap.set(course.id, {
          ...course,
          title: course.name || 'Untitled Course',
          enrolledAt: enrollment.createdAt,
          thumbnailUrl: course.previewVideoUrl || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
          category: course.instrument || 'Other',
          duration: course.durationMinutes || 60,
          price: course.pricePerSlot || 0,
        });
      }
    }

    return Array.from(coursesMap.values());
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

