import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import db from '../lib/db.js';
import { generateToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import notificationService from './notification.service.js';

class AuthService {
  async register(userData) {
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
    } = userData;

    console.log('[Auth Service] Starting registration for:', email);

    // Validate building - support both buildingId (new) and buildingCode (legacy)
    let requestedBuildingId = null;
    let buildingApprovalStatus = null;
    let buildingVisibility = null;
    
    if (buildingId) {
      // New flow: buildingId provided directly from search
      console.log('[Auth Service] Validating building ID:', buildingId);
      const building = await db.building.findUnique({
        where: { id: buildingId },
        select: { id: true, name: true, approvalStatus: true, visibilityType: true },
      });
      
      if (!building) {
        throw new Error('Invalid building. Please select a valid building.');
      }
      
      if (building.approvalStatus !== 'ACTIVE') {
        throw new Error('This building is not yet active. Please contact support.');
      }
      
      requestedBuildingId = building.id;
      buildingVisibility = building.visibilityType;
      
      // PUBLIC buildings: immediate access, PRIVATE: pending verification
      if (building.visibilityType === 'PUBLIC') {
        buildingApprovalStatus = 'ACTIVE';
        console.log('[Auth Service] Public building - immediate access:', building.name);
      } else {
        buildingApprovalStatus = 'PENDING_VERIFICATION';
        console.log('[Auth Service] Private building - pending verification:', building.name);
      }
    } else if (buildingCode) {
      // Legacy flow: buildingCode provided
      console.log('[Auth Service] Validating building code:', buildingCode);
      const building = await db.building.findUnique({
        where: { registrationCode: buildingCode.toUpperCase() },
        select: { id: true, name: true, approvalStatus: true, visibilityType: true },
      });
      
      if (!building) {
        throw new Error('Invalid building code. Please check and try again.');
      }
      
      if (building.approvalStatus !== 'ACTIVE') {
        throw new Error('This building is not yet active. Please contact support.');
      }
      
      requestedBuildingId = building.id;
      buildingVisibility = building.visibilityType;
      buildingApprovalStatus = 'PENDING_VERIFICATION';
      console.log('[Auth Service] Building validated (pending approval):', building.name);
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('[Auth Service] User already exists:', email);
      throw new Error('User already exists with this email');
    }

    console.log('[Auth Service] Hashing password');
    // Hash password with bcrypt (matching web app)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('[Auth Service] Creating user in database');
    // Create user with error handling
    // Building is now REQUIRED - always assign buildingId
    // For PUBLIC buildings: status = ACTIVE (immediate access)
    // For PRIVATE buildings: status = PENDING_VERIFICATION (needs admin approval)
    let user;
    try {
      const userData = {
        email,
        password: hashedPassword,
        name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`,
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`,
        emailVerified: false,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        // Building assignment
        buildingId: requestedBuildingId,
        // Location data
        latitude: latitude || null,
        longitude: longitude || null,
        // Proof documents
        governmentIdUrl: proofDocument || null,
        // Approval status based on building type
        approvalStatus: buildingApprovalStatus || 'ACTIVE',
        // Security fields
        failedLoginAttempts: 0,
        isActive: true,
        passwordChangedAt: new Date(),
      };

      user = await db.user.create({
        data: userData,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          profilePicture: true,
          role: true,
          createdAt: true,
          emailVerified: true,
          buildingId: true,
          approvalStatus: true,
          phone: true,
          dateOfBirth: true,
          building: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              visibilityType: true,
            },
          },
        },
      });
      
      console.log('[Auth Service] User created successfully:', user.id, 'buildingId:', user.buildingId);
    } catch (dbError) {
      console.error('[Auth Service] Database error creating user:', dbError);
      
      // Check for duplicate email error
      if (dbError.code === 'P2002' || dbError.meta?.target?.includes('email')) {
        throw new Error('User already exists with this email');
      }
      
      // Check for database connection error
      if (dbError.code === 'P1001' || dbError.code === 'P1000') {
        console.error('[Auth Service] Database connection error');
        throw new Error('Database connection failed. Please try again later.');
      }
      
      // Generic database error
      throw new Error(`Database error: ${dbError.message || 'Failed to create user'}`);
    }

    // Generate verification token (UUID)
    const rawVerificationToken = uuidv4();
    // Hash token with SHA-256 before storing
    const hashedVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
    const expires = add(new Date(), { minutes: 30 });

    console.log('[Auth Service] Updating user with verification token');
    await db.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashedVerificationToken,
        verificationExpiry: expires,
        emailVerified: false,
      },
    });

    console.log('[Auth Service] Sending verification email');
    // Send verification email with RAW token (for deep link)
    try {
      await sendVerificationEmail(user.email, rawVerificationToken, user.name);
      console.log('[Auth Service] Verification email sent successfully');
    } catch (emailError) {
      console.error('[Auth Service] Failed to send verification email:', emailError);
      // Don't fail registration if email fails, just log it
    }

    // Send notifications for private building enrollment
    if (buildingVisibility === 'PRIVATE' && requestedBuildingId) {
      console.log('[Auth Service] Private building - sending notifications to admins');
      try {
        // Notify building admins about new enrollment request
        await notificationService.notifyBuildingAdminsNewEnrollment(requestedBuildingId, {
          userId: user.id,
          name: user.name,
          email: user.email,
          proofDocument: proofDocument,
        });
        
        // Notify user that their request is pending
        const buildingName = user.building?.name || 'the building';
        await notificationService.notifyUserBuildingPending(user.id, buildingName);
        
        console.log('[Auth Service] Notifications sent for private building enrollment');
      } catch (notifError) {
        console.error('[Auth Service] Failed to send notifications:', notifError);
        // Don't fail registration if notifications fail
      }
    }

    console.log('[Auth Service] Registration completed successfully');
    // Return only success message - NO JWT token until email is verified
    return { 
      message: 'Verification email sent'
    };
  }

  async login(email, password) {
    // Enforce exact order: a. Find user, b. If not verified → reject (for mobile users), c. If locked → reject, d. Verify password, e. Generate JWT
    
    // a. Find user
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        emailVerified: true,
        failedLoginAttempts: true,
        lastFailedLogin: true,
        isLockedUntil: true,
      },
    });

    // Use single generic error message for all failures (security best practice)
    const genericError = 'Invalid email or password';

    if (!user) {
      throw new Error(genericError);
    }

    // c. If locked → reject
    const now = new Date();
    if (user.isLockedUntil && now < user.isLockedUntil) {
      throw new Error(genericError);
    }

    // d. Verify password with bcrypt
    // Note: Support both bcrypt ($2a$, $2b$) and argon2 ($argon2) hashes for backward compatibility
    let isPasswordValid = false;
    
    console.log('[Auth Service] Password hash prefix:', user.password?.substring(0, 10));
    
    try {
      if (user.password.startsWith('$argon2')) {
        // Legacy argon2 hash - need to migrate
        // For now, reject and ask user to reset password
        console.log('[Auth Service] User has argon2 password hash - needs migration');
        throw new Error('Please reset your password to continue. Use "Forgot Password" option.');
      }
      
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('[Auth Service] Password comparison result:', isPasswordValid);
    } catch (bcryptError) {
      if (bcryptError.message.includes('reset your password')) {
        throw bcryptError; // Re-throw password migration error
      }
      console.error('[Auth Service] Password verification error:', bcryptError);
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData = {
        failedLoginAttempts: newFailedAttempts,
        lastFailedLogin: now,
      };

      // Lock account if 5 or more failed attempts
      if (newFailedAttempts >= 5) {
        const lockUntil = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
        updateData.isLockedUntil = lockUntil;
      }

      // Update user with failed attempt data
      await db.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new Error(genericError);
    }

    // b. If not verified → reject
    if (user.emailVerified === false) {
      throw new Error(genericError);
    }

    // Password is correct - reset failed login attempts
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        isLockedUntil: null,
        lastLoginAt: now,
      },
    });

    // Check if user is active
    if (!user.isActive) {
      throw new Error(genericError);
    }

    // e. Generate JWT token (only after all checks pass)
    const authToken = generateToken({ userId: user.id, email: user.email, role: user.role });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return { token: authToken, user: userWithoutPassword };
  }

  async getProfile(userId) {
    console.log('[Auth Service] getProfile called for userId:', userId);
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        profilePicture: true,
        phone: true,
        role: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        emailVerified: true,
        dateOfBirth: true,
        // Building relationship
        buildingId: true,
        approvalStatus: true,
        approvedAt: true,
        rejectedReason: true,
        // Location
        latitude: true,
        longitude: true,
        // Documents
        governmentIdUrl: true,
        resumeUrl: true,
        certificatesUrl: true,
        // Teacher-specific fields
        specializations: true,
        yearsOfExperience: true,
        academyId: true,
        isActive: true,
        building: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            registrationCode: true,
            visibilityType: true,
          },
        },
        academy: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    console.log('[Auth Service] User found - buildingId:', user.buildingId, 'building:', user.building);

    // Parse requested building ID from rejectedReason if present
    let requestedBuildingId = null;
    if (user.rejectedReason?.startsWith('REQUESTED_BUILDING:')) {
      requestedBuildingId = user.rejectedReason.replace('REQUESTED_BUILDING:', '');
    }

    // Determine building approval status for frontend
    let buildingApprovalStatus = null;
    if (user.buildingId) {
      buildingApprovalStatus = 'APPROVED';
    } else if (requestedBuildingId) {
      buildingApprovalStatus = user.approvalStatus; // PENDING_VERIFICATION
    }

    const result = {
      ...user,
      requestedBuildingId,
      buildingApprovalStatus,
    };
    
    console.log('[Auth Service] Returning profile with buildingId:', result.buildingId);
    return result;
  }

  async updateProfile(userId, updates) {
    const { 
      name, 
      avatar, 
      profilePicture, 
      bio, 
      email, 
      phone,
      dateOfBirth,
      governmentIdUrl,
      latitude,
      longitude,
      specializations,
      yearsOfExperience,
      resumeUrl,
      certificatesUrl
    } = updates;

    // Build update data - handle all user fields that exist in Prisma schema
    const updateData = {};
    
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    
    // Location
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    
    // Documents
    if (governmentIdUrl !== undefined) updateData.governmentIdUrl = governmentIdUrl;
    if (resumeUrl !== undefined) updateData.resumeUrl = resumeUrl;
    if (certificatesUrl !== undefined) updateData.certificatesUrl = certificatesUrl;
    
    // Teacher-specific fields
    if (specializations !== undefined) updateData.specializations = specializations;
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = yearsOfExperience;
    
    // Handle profile picture - sync both fields
    if (profilePicture) {
      updateData.profilePicture = profilePicture;
      updateData.avatar = profilePicture; // Keep avatar in sync
    } else if (avatar) {
      updateData.avatar = avatar;
      updateData.profilePicture = avatar; // Keep profilePicture in sync
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        profilePicture: true,
        bio: true,
        phone: true,
        role: true,
        dateOfBirth: true,
        latitude: true,
        longitude: true,
        specializations: true,
        yearsOfExperience: true,
      },
    });

    return user;
  }

  async verifyEmail(token) {
    console.log('[Auth Service] Starting email verification for token');
    
    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await db.user.findFirst({
      where: { verificationToken: hashedToken },
    });

    if (!user) {
      console.error('[Auth Service] Invalid verification token - user not found');
      throw new Error('Invalid verification token');
    }

    console.log('[Auth Service] User found for verification, userId:', user.id);

    const now = new Date();
    if (user.verificationExpiry && now > user.verificationExpiry) {
      console.error('[Auth Service] Verification token expired for userId:', user.id);
      throw new Error('Verification token has expired');
    }

    // Check if already verified
    if (user.emailVerified) {
      console.log('[Auth Service] Email already verified for userId:', user.id);
      // Still generate token for auto-login
      const authToken = generateToken({ userId: user.id, email: user.email, role: user.role });
      const { password: _, verificationToken: __, ...userWithoutSensitive } = user;
      return { 
        message: 'Email already verified',
        token: authToken,
        user: userWithoutSensitive
      };
    }

    console.log('[Auth Service] Updating user verification status');
    // Update user: set emailVerified = true, clear token fields
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    console.log('[Auth Service] Email verified successfully for userId:', user.id);
    
    // Generate JWT token for auto-login after verification
    const authToken = generateToken({ userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role });
    
    // Return user without sensitive fields
    const { password: _, verificationToken: __, ...userWithoutSensitive } = updatedUser;
    
    return { 
      message: 'Email verified successfully',
      token: authToken,
      user: userWithoutSensitive
    };
  }

  /**
   * Forgot Password Flow
   * 
   * IMPORTANT: If Prisma errors occur, ensure:
   * 1. Database schema matches: npx prisma migrate dev
   * 2. Prisma client is regenerated: npx prisma generate
   * 3. Backend server is restarted after Prisma changes
   * 
   * Flow order:
   * 1. Find user by email
   * 2. Generate and hash reset token
   * 3. Invalidate previous reset tokens (with error handling)
   * 4. Save new reset token (with error handling)
   * 5. Send password reset email
   */
  async forgotPassword(email) {
    console.log(`[Auth Service] Forgot password flow started for email: ${email}`);
    
    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      console.log(`[Auth Service] User not found for email: ${email} (returning generic success)`);
      // Return success even if user doesn't exist to prevent email enumeration
      return { message: 'If your email is registered, you will receive a reset link.' };
    }

    console.log(`[Auth Service] User found`);
    
    // Generate random token (32 bytes = 256 bits)
    const rawToken = crypto.randomBytes(32).toString('hex');
    console.log(`[Auth Service] Reset token generated`);
    
    // Hash token with SHA-256 before storing
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    // Set expiry to 15 minutes from now
    const resetTokenExpiry = add(new Date(), { minutes: 15 });

    // Invalidate any previous reset tokens before saving new one
    // Defensive fix: Don't block email sending if schema isn't ready yet
    console.log(`[Auth Service] Invalidating previous reset tokens for userId: ${user.id}`);
    try {
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      console.log(`[Auth Service] Previous reset tokens invalidated successfully`);
    } catch (err) {
      console.warn(`⚠️ [Auth Service] Skipping reset token invalidation (schema not ready)`);
      console.warn(`⚠️ [Auth Service] Error:`, err.message);
      // Continue execution - don't block email sending
    }
    
    // Save new reset token to database
    // Flow order: invalidate previous tokens → save new token → send email
    console.log(`[Auth Service] Saving new reset token to database`);
    console.log(`[Auth Service] User ID: ${user.id}`);
    console.log(`[Auth Service] Hashed token length: ${hashedToken.length}`);
    console.log(`[Auth Service] Token expiry: ${resetTokenExpiry.toISOString()}`);
    
    try {
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry: resetTokenExpiry,
        },
        select: {
          id: true,
          email: true,
          resetToken: true,
          resetTokenExpiry: true,
        },
      });
      console.log(`[Auth Service] ✅ Reset token saved to database successfully`);
      console.log(`[Auth Service] Updated user:`, {
        id: updatedUser.id,
        email: updatedUser.email,
        hasResetToken: !!updatedUser.resetToken,
        resetTokenExpiry: updatedUser.resetTokenExpiry?.toISOString(),
      });
    } catch (err) {
      console.error(`❌ [Auth Service] FAILED TO SAVE RESET TOKEN TO DATABASE`);
      console.error(`❌ [Auth Service] Error message:`, err.message);
      console.error(`❌ [Auth Service] Error code:`, err.code);
      console.error(`❌ [Auth Service] Error meta:`, err.meta);
      console.error(`❌ [Auth Service] Error stack:`, err.stack);
      console.error(`❌ [Auth Service] Full error:`, JSON.stringify(err, null, 2));
      
      // Check if it's a schema mismatch error
      if (err.message.includes('Unknown field') || err.message.includes('does not exist')) {
        console.error(`❌ [Auth Service] SCHEMA MISMATCH DETECTED!`);
        console.error(`❌ [Auth Service] The database columns do not match the Prisma schema.`);
        console.error(`❌ [Auth Service] Run: npx prisma generate`);
        console.error(`❌ [Auth Service] Or: npx prisma migrate dev`);
      }
      
      // Re-throw to make it visible, but controller will catch it
      throw err;
    }
    
    // Send password reset email with raw token (for the link)
    console.log(`[Auth Service] Sending reset email to: ${user.email}`);
    try {
      await sendPasswordResetEmail(user.email, rawToken);
      console.log(`[Auth Service] ✅ Password reset email sent successfully`);
    } catch (emailError) {
      console.error('[Auth Service] Failed to send password reset email:', emailError);
      // Don't fail the request if email fails, just log it - user will get generic success message
    }
    
    return { message: 'If your email is registered, you will receive a reset link.' };
  }

  async resetPassword(token, newPassword) {
    console.log(`[Auth Service] Reset password flow started, validating token`);
    
    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching reset token
    const user = await db.user.findFirst({
      where: {
        resetToken: hashedToken,
      },
      select: {
        id: true,
        resetTokenExpiry: true,
      },
    });

    if (!user) {
      console.log(`[Auth Service] Invalid reset token provided`);
      throw new Error('Invalid or expired reset token');
    }

    console.log(`[Auth Service] Reset token validated for userId: ${user.id}`);
    
    // Check if token has expired
    const now = new Date();
    if (!user.resetTokenExpiry || now > user.resetTokenExpiry) {
      console.log(`[Auth Service] Reset token expired for userId: ${user.id}`);
      // Clear expired token
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      throw new Error('Reset token has expired. Please request a new one.');
    }

    // Validate password strength server-side
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    if (!/[A-Z]/.test(newPassword)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(newPassword)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(newPassword)) {
      throw new Error('Password must contain at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      throw new Error('Password must contain at least one special character');
    }

    // Hash new password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token fields
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        // Reset failed login attempts on password reset
        failedLoginAttempts: 0,
        isLockedUntil: null,
        lastFailedLogin: null,
        // Update password changed timestamp
        passwordChangedAt: new Date(),
      },
    });

    console.log(`[Auth Service] Password reset successful for userId=${user.id}`);
    // Note: JWT tokens are stateless and cannot be invalidated server-side without a token blacklist.
    // Existing tokens will remain valid until expiry. The password change ensures no new logins
    // can occur with the old password, which is the primary security concern.
    
    return { message: 'Password reset successfully' };
  }

  /**
   * Change Password (for logged-in users)
   * Verifies current password and updates to new password
   */
  async changePassword(userId, currentPassword, newPassword) {
    console.log(`[Auth Service] Change password flow started for userId: ${userId}`);
    
    // Find user with password
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password with bcrypt
    let isPasswordValid = false;
    
    try {
      isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    } catch (bcryptError) {
      console.error('[Auth Service] Password verification error:', bcryptError);
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    if (!/[A-Z]/.test(newPassword)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(newPassword)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(newPassword)) {
      throw new Error('Password must contain at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      throw new Error('Password must contain at least one special character');
    }

    // Hash new password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and timestamp
    await db.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    console.log(`[Auth Service] Password changed successfully for userId: ${userId}`);
    return { message: 'Password changed successfully' };
  }

  /**
   * Google OAuth Login
   * Verifies Google ID token and creates/updates user
   */
  async googleLogin(idToken) {
    try {
      console.log('[Auth Service] Google login - verifying ID token');
      
      // Get Google Client ID from environment (must be Web OAuth Client ID)
      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('GOOGLE_CLIENT_ID is not configured');
      }
      
      // Verify ID token using google-auth-library
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      
      let ticket;
      try {
        ticket = await client.verifyIdToken({
          idToken,
          audience: GOOGLE_CLIENT_ID, // Must match the Web OAuth Client ID
        });
      } catch (verifyError) {
        console.error('[Auth Service] Google ID token verification failed:', verifyError);
        throw new Error('Invalid Google ID token');
      }
      
      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }
      
      const { sub: googleId, email, name, picture } = payload;
      
      if (!email) {
        throw new Error('Email not provided by Google');
      }
      
      console.log('[Auth Service] Google token verified for:', email);
      
      // Find or create user
      let user = await db.user.findUnique({
        where: { email },
      });
      
      if (user) {
        // User exists - update avatar if provided and different
        if (picture && picture !== user.avatar) {
          user = await db.user.update({
            where: { id: user.id },
            data: { avatar: picture },
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              role: true,
              createdAt: true,
              emailVerified: true,
            },
          });
        }
        console.log('[Auth Service] Existing user found:', user.email);
      } else {
        // Create new user
        user = await db.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            avatar: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=7c3aed&color=fff`,
            password: crypto.randomBytes(32).toString('hex'), // Random password (user can't login with email/password)
            emailVerified: true, // Google accounts are pre-verified
          },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            createdAt: true,
            emailVerified: true,
          },
        });
        console.log('[Auth Service] New user created via Google:', user.email);
      }
      
      // Generate JWT token
      const token = generateToken(user.id);
      
      return {
        user,
        token,
      };
    } catch (error) {
      console.error('[Auth Service] Google login error:', error);
      throw error;
    }
  }
}

export async function verifyEmailToken(token) {
  console.log('[Auth Service] verifyEmailToken called');
  
  // Hash the provided token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await db.user.findFirst({ where: { verificationToken: hashedToken } });
  if (!user) {
    console.error('[Auth Service] verifyEmailToken: Invalid token - user not found');
    throw new Error('Invalid verification token');
  }

  console.log('[Auth Service] verifyEmailToken: User found, userId:', user.id);

  if (user.verificationExpiry && new Date(user.verificationExpiry) < new Date()) {
    console.error('[Auth Service] verifyEmailToken: Token expired for userId:', user.id);
    throw new Error('Verification token expired');
  }

  // Check if already verified
  if (user.emailVerified) {
    console.log('[Auth Service] verifyEmailToken: Email already verified for userId:', user.id);
    return { message: 'Email already verified' };
  }

  console.log('[Auth Service] verifyEmailToken: Updating verification status');
  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationExpiry: null,
    },
  });

  console.log('[Auth Service] verifyEmailToken: Email verified successfully for userId:', user.id);
  return { message: 'Email verified successfully' };
}

export async function checkVerificationStatus(email) {
  console.log('[Auth Service] Checking verification status for email:', email);
  
  const user = await db.user.findUnique({
    where: { email },
    select: {
      email: true,
      emailVerified: true,
    },
  });

  if (!user) {
    console.error('[Auth Service] checkVerificationStatus: User not found for email:', email);
    throw new Error('User not found');
  }

  console.log('[Auth Service] checkVerificationStatus: User found, emailVerified:', user.emailVerified);
  
  return {
    email: user.email,
    emailVerified: user.emailVerified,
    isVerified: user.emailVerified, // Alias for compatibility
  };
}

export async function resendVerificationEmail(email) {
  console.log('[Auth Service] Resending verification email for:', email);
  
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      verificationExpiry: true,
    },
  });

  if (!user) {
    console.error('[Auth Service] resendVerificationEmail: User not found for email:', email);
    throw new Error('User not found');
  }

  if (user.emailVerified) {
    console.log('[Auth Service] resendVerificationEmail: Email already verified for userId:', user.id);
    throw new Error('Email is already verified');
  }

  // Rate limiting: Check if verification email was sent recently (within last 60 seconds)
  if (user.verificationExpiry) {
    const now = new Date();
    const timeSinceLastEmail = now.getTime() - user.verificationExpiry.getTime();
    // If token was created less than 60 seconds ago, rate limit
    if (timeSinceLastEmail > -60000 && timeSinceLastEmail < 0) {
      const secondsRemaining = Math.ceil(Math.abs(timeSinceLastEmail) / 1000);
      console.log('[Auth Service] resendVerificationEmail: Rate limit - email sent too recently');
      throw new Error(`Please wait ${secondsRemaining} seconds before requesting another verification email`);
    }
  }

  console.log('[Auth Service] resendVerificationEmail: Generating new verification token');
  // Generate new verification token
  const rawVerificationToken = uuidv4();
  // Hash token with SHA-256 before storing
  const hashedVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
  const expires = add(new Date(), { minutes: 30 });

  // Update with new token (this replaces old token, ensuring only the new token works)
  await db.user.update({
    where: { id: user.id },
    data: {
      verificationToken: hashedVerificationToken,
      verificationExpiry: expires,
    },
  });

  console.log('[Auth Service] resendVerificationEmail: Sending verification email');
  // Send verification email with RAW token (for deep link)
  try {
    await sendVerificationEmail(user.email, rawVerificationToken, user.name);
    console.log('[Auth Service] resendVerificationEmail: Verification email sent successfully');
  } catch (emailError) {
    console.error('[Auth Service] resendVerificationEmail: Failed to send email:', emailError);
    // Don't fail the request if email fails, just log it
  }

  return { message: 'Verification email sent' };
}

export default new AuthService();

