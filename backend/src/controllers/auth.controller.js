import authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const register = async (req, res) => {
  try {
    // Debug: Log complete request body
    console.log('[Auth Controller] Register request body:', JSON.stringify(req.body, null, 2));
    console.log('[Auth Controller] Request headers:', req.headers['content-type']);
    
    // Destructure from req.body (not req.body.data)
    const { email, password, name } = req.body;

    console.log('[Auth Controller] Extracted fields:', { 
      email: email ? 'provided' : 'missing',
      password: password ? 'provided' : 'missing',
      name: name ? 'provided' : 'missing'
    });

    // Validation guard - return 400 if any field is missing
    if (!email || !password || !name) {
      console.log('[Auth Controller] Validation failed - missing fields');
      return errorResponse(res, 'All fields are required: name, email, and password', 400);
    }

    console.log('[Auth Controller] Calling authService.register');
    const result = await authService.register({ email, password, name });

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
            input { width:100%; padding:12px; margin-bottom:16px; border:1px solid #e5e7eb; border-radius:8px; font-size:16px; box-sizing:border-box; }
            button { width:100%; padding:12px; background:#5b21b6; color:white; border:none; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer; }
            button:hover { background:#7c3aed; }
            button:disabled { opacity:0.5; cursor:not-allowed; }
            .error { color:#ef4444; margin-top:8px; font-size:14px; }
            .success { color:#10b981; margin-top:8px; font-size:14px; }
            .help { color:#6b7280; font-size:12px; margin-top:4px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Reset Password</h1>
            <p class="subtitle">Enter your new password below</p>
            <form id="resetForm">
              <input type="password" id="password" placeholder="New Password" required>
              <div class="help">Password must be at least 6 characters with uppercase, lowercase, number, and special character</div>
              <input type="password" id="confirmPassword" placeholder="Confirm Password" required>
              <div id="error" class="error"></div>
              <div id="success" class="success"></div>
              <button type="submit" id="submitBtn">Reset Password</button>
            </form>
          </div>
          <script>
            const form = document.getElementById('resetForm');
            const errorDiv = document.getElementById('error');
            const successDiv = document.getElementById('success');
            const submitBtn = document.getElementById('submitBtn');
            
            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              errorDiv.textContent = '';
              successDiv.textContent = '';
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
                  successDiv.textContent = 'Password reset successfully! You can now close this page.';
                  form.style.display = 'none';
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

