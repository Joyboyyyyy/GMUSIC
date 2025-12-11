import authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return errorResponse(res, 'All fields are required', 400);
    }

    const result = await authService.register({ email, password, name });

    return successResponse(res, result, 'Registration successful', 201);
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, error.message || 'Registration failed', 400);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const result = await authService.login(email, password);

    return successResponse(res, result, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, error.message || 'Login failed', 401);
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await authService.getProfile(userId);

    return successResponse(res, user);
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, error.message || 'Failed to get profile');
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const user = await authService.updateProfile(userId, updates);

    return successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, error.message || 'Failed to update profile');
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return errorResponse(res, 'Verification token is required', 400);
    }

    const result = await authService.verifyEmail(token);

    return successResponse(res, result, 'Email verified successfully');
  } catch (error) {
    console.error('Verify email error:', error);
    return errorResponse(res, error.message || 'Email verification failed', 400);
  }
};

