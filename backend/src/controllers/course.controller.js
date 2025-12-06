import courseService from '../services/course.service.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response.js';

export const getAllCourses = async (req, res) => {
  try {
    const { category, level, search } = req.query;

    const courses = await courseService.getAllCourses({ category, level, search });

    return successResponse(res, courses);
  } catch (error) {
    console.error('Get courses error:', error);
    return errorResponse(res, 'Failed to fetch courses');
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await courseService.getCourseById(courseId);

    return successResponse(res, course);
  } catch (error) {
    console.error('Get course error:', error);
    return notFoundResponse(res, error.message || 'Course not found');
  }
};

export const getUserCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const courses = await courseService.getUserCourses(userId);

    return successResponse(res, courses);
  } catch (error) {
    console.error('Get user courses error:', error);
    return errorResponse(res, 'Failed to fetch user courses');
  }
};

export const createCourse = async (req, res) => {
  try {
    const courseData = req.body;

    const course = await courseService.createCourse(courseData);

    return successResponse(res, course, 'Course created successfully', 201);
  } catch (error) {
    console.error('Create course error:', error);
    return errorResponse(res, error.message || 'Failed to create course', 400);
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const updates = req.body;

    const course = await courseService.updateCourse(courseId, updates);

    return successResponse(res, course, 'Course updated successfully');
  } catch (error) {
    console.error('Update course error:', error);
    return errorResponse(res, error.message || 'Failed to update course');
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await courseService.deleteCourse(courseId);

    return successResponse(res, result);
  } catch (error) {
    console.error('Delete course error:', error);
    return errorResponse(res, error.message || 'Failed to delete course');
  }
};

export const addTrack = async (req, res) => {
  try {
    const { courseId } = req.params;
    const trackData = req.body;

    const track = await courseService.addTrackToCourse(courseId, trackData);

    return successResponse(res, track, 'Track added successfully', 201);
  } catch (error) {
    console.error('Add track error:', error);
    return errorResponse(res, error.message || 'Failed to add track', 400);
  }
};

