import zohoService from '../services/zoho.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const syncUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await zohoService.syncEnrollmentData(userId);

    return successResponse(res, result, 'Data synced to Zoho successfully');
  } catch (error) {
    console.error('Zoho sync error:', error);
    return errorResponse(res, error.message || 'Failed to sync data to Zoho', 500);
  }
};

export const createLead = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return errorResponse(res, 'Course ID is required', 400);
    }

    const result = await zohoService.createLeadFromUser(req.user, courseId);

    return successResponse(res, result, 'Lead created in Zoho');
  } catch (error) {
    console.error('Zoho create lead error:', error);
    return errorResponse(res, error.message || 'Failed to create lead', 500);
  }
};

