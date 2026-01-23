import authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const register = async (req, res) => {
  try {
    // Debug: Log complete request body
    console.log('[Auth Controller] Register request body:', JSON.stringify(req.body, null, 2));
    console.log('[Auth Controller] Request headers:', req.headers['content-type']);
    
    // Destructure from req.body (including all user fields)
    const { 
      email, 
      password, 
      name, 
      dateOfBirth, 
      phone, 
      buildingCode, 
      buildingId,
      proofDocument,
      latitude,
      longitude
    } = req.body;

    console.log('[Auth Controller] Extracted fields:', { 
      email: email ? 'provided' : 'missing',
      password: password ? 'provided' : 'missing',
      name: name ? 'provided' : 'missing',
      phone: phone ? 'provided' : 'not provided',
      dateOfBirth: dateOfBirth ? 'provided' : 'not provided',
      buildingCode: buildingCode ? 'provided' : 'not provided',
      buildingId: buildingId ? 'provided' : 'not provided',
      proofDocument: proofDocument ? 'provided (base64)' : 'not provided',
      latitude: latitude ? 'provided' : 'not provided',
      longitude: longitude ? 'provided' : 'not provided'
    });

    // Validation guard - return 400 if required fields are missing
    if (!email || !password || !name) {
      console.log('[Auth Controller] Validation failed - missing fields');
      return errorResponse(res, 'All fields are required: name, email, and password', 400);
    }

    console.log('[Auth Controller] Calling authService.register');
    const result = await authService.register({ 
      email, 
      password, 
      name, 
      dateOfBirth, 
      phone,
      buildingCode,
      buildingId,
      proofDocument,
      latitude,
      longitude
    });

    console.log('[Auth Controller] Registration successful, returning response');
    return successResponse(res, result, result.message || 'Verification email sent', 201);
  } catch (error) {
    console.error('[Auth Controller] Register error:', error);
    // Return clear error message for duplicate email
    const errorMessage = error.message === 'User already exists with this email'
      ? 'User already exists with this email'
      : error.message || 'Registration failed';
    return errorResponse(res, errorMessage, 400);
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
    // Use single generic error message for all failures (security)
    return errorResponse(res, 'Invalid email or password', 401);
  }
};

/**
 * Get User Profile
 * 
 * PROFILE PICTURE FIELD USAGE:
 * - Response includes both `profilePicture` (PRIMARY) and `avatar` (LEGACY) fields
 * - Both fields contain identical values
 * - Clients should use `profilePicture` field for display
 * - The `avatar` field is maintained for backward compatibility only
 * 
 * Response Example:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "profilePicture": "https://storage.url/image.jpg",  // Use this field
 *     "avatar": "https://storage.url/image.jpg",          // Legacy field
 *     ...
 *   }
 * }
 */
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

/**
 * Update User Profile
 * 
 * PROFILE PICTURE FIELD USAGE:
 * - Use `profilePicture` field for new implementations (PRIMARY field)
 * - The `avatar` field is still supported for backward compatibility (LEGACY field)
 * - Both fields are automatically synchronized - updating either will update both
 * 
 * Request Body Examples:
 * - Recommended: { "profilePicture": "https://storage.url/image.jpg" }
 * - Legacy: { "avatar": "https://storage.url/image.jpg" }
 * 
 * Response always includes both fields with identical values:
 * { "profilePicture": "url", "avatar": "url" }
 */
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

// Forgot Password Controller
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    console.log('[Auth Controller] Forgot password - email received:', email);
    console.log('[Auth Controller] Forgot password - starting email send...');

    const result = await authService.forgotPassword(email);
    
    console.log('[Auth Controller] Forgot password - email sent successfully');
    return successResponse(res, result, result.message);
  } catch (error) {
    console.error('[Auth Controller] Forgot password - email send failed:', error.message);
    return errorResponse(res, 'Email send failed', 500);
  }
};

// Reset Password GET - Show reset form (when user clicks email link)
export const resetPasswordGet = async (req, res) => {
  try {
    // Support both URL param and query param for backward compatibility
    const token = req.params.token || req.query.token;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invalid Reset Link</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; margin:0; padding:20px; background:#f5f6f8; }
              .box { max-width:500px; margin:50px auto; background:white; border-radius:8px; padding:24px; text-align:center; }
              h1 { color:#ef4444; margin-bottom:16px; }
              p { color:#6b7280; }
            </style>
          </head>
          <body>
            <div class="box">
              <h1>Invalid Reset Link</h1>
              <p>This password reset link is invalid or missing a token.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Serve HTML form for password reset
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reset Password</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; margin:0; padding:20px; background:#f5f6f8; }
            .box { max-width:500px; margin:50px auto; background:white; border-radius:8px; padding:24px; }
            h1 { color:#1f2937; margin-bottom:8px; }
            .subtitle { color:#6b7280; margin-bottom:24px; }
            .input-wrapper { position:relative; margin-bottom:16px; }
            input { width:100%; padding:12px 40px 12px 12px; border:1px solid #e5e7eb; border-radius:8px; font-size:16px; box-sizing:border-box; }
            .eye-icon { position:absolute; right:12px; top:50%; transform:translateY(-50%); cursor:pointer; font-size:20px; color:#6b7280; user-select:none; }
            button { width:100%; padding:12px; background:#5b21b6; color:white; border:none; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer; margin-top:8px; }
            button:hover { background:#7c3aed; }
            button:disabled { opacity:0.5; cursor:not-allowed; }
            .error { color:#ef4444; margin-top:8px; font-size:14px; }
            .success { color:#10b981; margin-top:16px; font-size:14px; text-align:center; }
            .help { color:#6b7280; font-size:12px; margin-top:4px; margin-bottom:16px; }
            .login-link { display:inline-block; margin-top:16px; padding:12px 24px; background:#1f2937; color:white; text-decoration:none; border-radius:8px; font-weight:600; }
            .login-link:hover { background:#374151; }
            .success-box { text-align:center; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Reset Password</h1>
            <p class="subtitle">Enter your new password below</p>
            <form id="resetForm">
              <div class="input-wrapper">
                <input type="password" id="password" placeholder="New Password" required>
                <span class="eye-icon" onclick="togglePassword('password', this)">👁️</span>
              </div>
              <div class="help">Password must be at least 6 characters with uppercase, lowercase, number, and special character</div>
              <div class="input-wrapper">
                <input type="password" id="confirmPassword" placeholder="Confirm Password" required>
                <span class="eye-icon" onclick="togglePassword('confirmPassword', this)">👁️</span>
              </div>
              <div id="error" class="error"></div>
              <button type="submit" id="submitBtn">Reset Password</button>
            </form>
            <div id="successBox" class="success-box" style="display:none;">
              <div class="success">✅ Password reset successful! Please login with your new password.</div>
              <a href="gretexmusicroom://login" class="login-link">Go to Login</a>
            </div>
          </div>
          <script>
            function togglePassword(inputId, icon) {
              const input = document.getElementById(inputId);
              if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = '🙈';
              } else {
                input.type = 'password';
                icon.textContent = '👁️';
              }
            }
            
            const form = document.getElementById('resetForm');
            const errorDiv = document.getElementById('error');
            const successBox = document.getElementById('successBox');
            const submitBtn = document.getElementById('submitBtn');
            
            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              errorDiv.textContent = '';
              submitBtn.disabled = true;
              submitBtn.textContent = 'Resetting...';
              
              const password = document.getElementById('password').value;
              const confirmPassword = document.getElementById('confirmPassword').value;
              
              if (password !== confirmPassword) {
                errorDiv.textContent = 'Passwords do not match';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Reset Password';
                return;
              }
              
              try {
                const response = await fetch('/api/auth/reset-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: '${token}', password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  form.style.display = 'none';
                  successBox.style.display = 'block';
                } else {
                  errorDiv.textContent = data.message || 'Password reset failed';
                  submitBtn.disabled = false;
                  submitBtn.textContent = 'Reset Password';
                }
              } catch (err) {
                errorDiv.textContent = 'Network error. Please try again.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Reset Password';
              }
            });
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; margin:0; padding:20px; background:#f5f6f8; }
            .box { max-width:500px; margin:50px auto; background:white; border-radius:8px; padding:24px; text-align:center; }
            h1 { color:#ef4444; margin-bottom:16px; }
            p { color:#6b7280; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Error</h1>
            <p>An error occurred. Please try again later.</p>
          </div>
        </body>
      </html>
    `);
  }
};

// Reset Password POST Controller
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return errorResponse(res, 'Token and password are required', 400);
    }

    const result = await authService.resetPassword(token, password);
    
    return successResponse(res, result, result.message);
  } catch (error) {
    return errorResponse(res, error.message || 'Password reset failed', 400);
  }
};

// Change Password Controller (for logged-in users)
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    const result = await authService.changePassword(userId, currentPassword, newPassword);
    
    return successResponse(res, result, result.message);
  } catch (error) {
    console.error('[Auth Controller] Change password error:', error);
    return errorResponse(res, error.message || 'Failed to change password', 400);
  }
};

// Google OAuth Login Controller
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return errorResponse(res, 'ID token is required', 400);
    }

    console.log('[Auth Controller] Google login request received');

    const result = await authService.googleLogin(idToken);

    return successResponse(res, result, 'Google login successful');
  } catch (error) {
    console.error('[Auth Controller] Google login error:', error);
    const errorMessage = error.message || 'Google login failed';
    return errorResponse(res, errorMessage, 401);
  }
};

// Test Email Route (TEMPORARY - for debugging only)
export const testEmail = async (req, res) => {
  try {
    const { sendPasswordResetEmail } = await import('../utils/email.js');
    // Hardcode recipient for testing
    const testEmailAddress = process.env.SMTP_USER || 'test@example.com';
    
    console.log('[Test Email] Sending test email to:', testEmailAddress);
    const info = await sendPasswordResetEmail(testEmailAddress, 'TEST_TOKEN_123');
    
    return res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      to: testEmailAddress,
      messageId: info.messageId
    });
  } catch (err) {
    console.error('[Test Email] ❌ Failed:', err.message);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Refresh Token Controller
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    // For now, just generate a new token with the same payload
    // In production, you'd verify the refresh token from database
    const { verifyToken } = await import('../utils/jwt.js');
    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    // Generate new access token
    const { generateToken } = await import('../utils/jwt.js');
    const newToken = generateToken({ 
      id: decoded.id, 
      email: decoded.email 
    });

    return successResponse(res, { 
      token: newToken,
      refreshToken: refreshToken // Return same refresh token
    }, 'Token refreshed successfully');
  } catch (error) {
    console.error('[Auth Controller] Refresh token error:', error);
    return errorResponse(res, 'Failed to refresh token', 401);
  }
};

