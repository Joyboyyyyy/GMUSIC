import searchService from '../services/search.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const search = async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.trim().length === 0) {
      return successResponse(res, [], 'No search query provided');
    }

    if (q.trim().length < 2) {
      return successResponse(res, [], 'Search query too short');
    }

    // Validate type if provided
    const validTypes = ['all', 'courses', 'teachers', 'buildings'];
    if (type && !validTypes.includes(type)) {
      return errorResponse(res, 'Invalid search type', 400);
    }

    const results = await searchService.search(q.trim(), type);

    return successResponse(res, results);
  } catch (error) {
    console.error('[Search Controller] Error:', error);
    return errorResponse(res, error.message || 'Search failed', 500);
  }
};
