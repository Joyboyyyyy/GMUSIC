import db from '../lib/db.js';

class TeacherService {
  /**
   * Get featured teachers (users with TEACHER role who have courses)
   * @param {number} limit - Maximum number of teachers to return
   * @returns {Promise<Array>} Array of teacher objects
   */
  async getFeaturedTeachers(limit = 10) {
    try {
      // Get teachers with their assignments
      const teachers = await db.user.findMany({
        where: {
          role: 'TEACHER',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
          bio: true,
          createdAt: true,
          teacherAssignments: {
            select: {
              authorizedInstruments: true,
              building: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                },
              },
            },
          },
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Get stats for each teacher
      const teachersWithStats = await Promise.all(
        teachers.map(async (teacher) => {
          // Get unique courses count
          let uniqueCoursesCount = 0;
          let studentCount = 0;
          let avgRating = 4.5;
          let ratingCount = 0;

          try {
            // Get unique courses where this teacher is assigned
            const uniqueCourses = await db.timeSlot.findMany({
              where: {
                teacherId: teacher.id,
              },
              select: {
                courseId: true,
              },
              distinct: ['courseId'],
            });
            uniqueCoursesCount = uniqueCourses.length;
          } catch (e) {
            console.log('[TeacherService] Error getting courses for teacher:', teacher.id, e.message);
          }

          try {
            // Get average rating from TeacherRating
            const ratings = await db.teacherRating.aggregate({
              where: {
                teacherId: teacher.id,
              },
              _avg: {
                rating: true,
              },
              _count: {
                rating: true,
              },
            });
            avgRating = ratings._avg.rating || 4.5;
            ratingCount = ratings._count.rating || 0;
          } catch (e) {
            console.log('[TeacherService] Error getting ratings for teacher:', teacher.id, e.message);
          }

          try {
            // Get student count
            studentCount = await db.slotEnrollment.count({
              where: {
                timeSlot: {
                  teacherId: teacher.id,
                },
                status: {
                  in: ['CONFIRMED', 'COMPLETED'],
                },
              },
            });
          } catch (e) {
            console.log('[TeacherService] Error getting students for teacher:', teacher.id, e.message);
          }

          // Get instruments from assignments
          const instruments = teacher.teacherAssignments.flatMap(
            (a) => a.authorizedInstruments || []
          );
          const uniqueInstruments = [...new Set(instruments)];

          // Get buildings
          const buildings = teacher.teacherAssignments
            .map((a) => a.building)
            .filter((b) => b !== null);

          return {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            avatarUrl: teacher.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name || 'Teacher')}&background=7c3aed&color=fff`,
            bio: teacher.bio || '',
            rating: avgRating,
            ratingCount: ratingCount,
            students: studentCount,
            coursesCount: uniqueCoursesCount,
            instruments: uniqueInstruments,
            buildings: buildings,
          };
        })
      );

      // Sort by rating and student count
      teachersWithStats.sort((a, b) => {
        const scoreA = a.rating * 0.6 + (a.students / 100) * 0.4;
        const scoreB = b.rating * 0.6 + (b.students / 100) * 0.4;
        return scoreB - scoreA;
      });

      return teachersWithStats;
    } catch (error) {
      console.error('[TeacherService] Error getting featured teachers:', error);
      throw error;
    }
  }

  /**
   * Get teacher by ID with full details
   * @param {string} teacherId - Teacher's user ID
   * @returns {Promise<Object>} Teacher object with details
   */
  async getTeacherById(teacherId) {
    try {
      const teacher = await db.user.findUnique({
        where: {
          id: teacherId,
          role: 'TEACHER',
        },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
          bio: true,
          createdAt: true,
          teacherAssignments: {
            select: {
              authorizedInstruments: true,
              building: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                },
              },
            },
          },
        },
      });

      if (!teacher) {
        return null;
      }

      // Get ratings
      const ratings = await db.teacherRating.aggregate({
        where: { teacherId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      // Get student count
      const studentCount = await db.slotEnrollment.count({
        where: {
          timeSlot: { teacherId },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      });

      // Get courses
      const courses = await db.timeSlot.findMany({
        where: { teacherId },
        select: {
          course: {
            select: {
              id: true,
              name: true,
              instrument: true,
              previewVideoUrl: true,
            },
          },
        },
        distinct: ['courseId'],
      });

      const instruments = teacher.teacherAssignments.flatMap(
        (a) => a.authorizedInstruments
      );

      return {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        avatarUrl: teacher.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=7c3aed&color=fff`,
        bio: teacher.bio || '',
        rating: ratings._avg.rating || 4.5,
        ratingCount: ratings._count.rating || 0,
        students: studentCount,
        instruments: [...new Set(instruments)],
        buildings: teacher.teacherAssignments.map((a) => a.building).filter(Boolean),
        courses: courses.map((c) => c.course).filter(Boolean),
      };
    } catch (error) {
      console.error('[TeacherService] Error getting teacher by ID:', error);
      throw error;
    }
  }
}

export default new TeacherService();
