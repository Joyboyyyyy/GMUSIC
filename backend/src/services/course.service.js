import db from '../lib/db.js';

class CourseService {
  async getAllCourses(filters = {}) {
    const { category, level, search } = filters;

    // Build where clause based on available fields
    const where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const courses = await db.course.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    return courses;
  }

  async getCourseById(courseId) {
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  async getUserCourses(userId) {
    const enrollments = await db.enrollment.findMany({
      where: { userId, status: 'paid' },
      include: {
        course: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollments.map((enrollment) => ({
      ...enrollment.course,
      enrolledAt: enrollment.createdAt,
    }));
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

