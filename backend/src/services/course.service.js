import prisma from '../config/prismaClient.js';

class CourseService {
  async getAllCourses(filters = {}) {
    const { category, level, search } = filters;

    const where = {
      isActive: true,
      ...(category && { category }),
      ...(level && { level }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const courses = await prisma.course.findMany({
      where,
      include: {
        tracks: {
          select: {
            id: true,
            title: true,
            duration: true,
            isPreview: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses;
  }

  async getCourseById(courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId, isActive: true },
      include: {
        tracks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  async getUserCourses(userId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            tracks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollments.map((enrollment) => ({
      ...enrollment.course,
      progress: enrollment.progress,
      enrolledAt: enrollment.createdAt,
    }));
  }

  async createCourse(courseData) {
    const course = await prisma.course.create({
      data: courseData,
    });

    return course;
  }

  async updateCourse(courseId, updates) {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: updates,
    });

    return course;
  }

  async deleteCourse(courseId) {
    await prisma.course.update({
      where: { id: courseId },
      data: { isActive: false },
    });

    return { message: 'Course deleted successfully' };
  }

  async addTrackToCourse(courseId, trackData) {
    const track = await prisma.track.create({
      data: {
        ...trackData,
        courseId,
      },
    });

    // Update course tracks count
    await prisma.course.update({
      where: { id: courseId },
      data: {
        tracksCount: { increment: 1 },
        duration: { increment: trackData.duration || 0 },
      },
    });

    return track;
  }
}

export default new CourseService();

