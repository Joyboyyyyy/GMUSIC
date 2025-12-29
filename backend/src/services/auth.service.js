import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import db from '../lib/db.js';
import { generateToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

class AuthService {
  async register(userData) {
    const { email, password, name, dateOfBirth, address } = userData;

    console.log('[Auth Service] Starting registration for:', email);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('[Auth Service] User already exists:', email);
      throw new Error('User already exists with this email');
    }

    console.log('[Auth Service] Hashing password');
    // Hash password with Argon2id
    const pepper = process.env.PASSWORD_PEPPER;
    if (!pepper) {
      console.warn('[Auth Service] PASSWORD_PEPPER not set, using empty string');
    }
    const hashedPassword = await argon2.hash(password + (pepper || ''), {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64MB
      timeCost: 3,
      parallelism: 1,
    });

    console.log('[Auth Service] Creating user in database');
    // Create user with error handling
    let user;
    try {
      // Build user data - only include dateOfBirth/address if migration has been applied
      const userData = {
        email,
        password: hashedPassword,
        name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`,
        isVerified: false,
      };

      // Try to include new fields if they exist in schema
      if (dateOfBirth || address) {
        try {
          // Test if columns exist by attempting to create with them
          user = await db.user.create({
            data: {
              ...userData,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              address: address || null,
            },
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              role: true,
              createdAt: true,
              isVerified: true,
            },
          });
        } catch (fieldError) {
          // If new fields cause error, create without them
          if (fieldError.code === 'P2022' || fieldError.message?.includes('does not exist')) {
            console.log('[Auth Service] dateOfBirth/address columns not yet in database, creating user without them');
            user = await db.user.create({
              data: userData,
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                createdAt: true,
                isVerified: true,
              },
            });
          } else {
            throw fieldError;
          }
        }
      } else {
        user = await db.user.create({
          data: userData,
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            createdAt: true,
            isVerified: true,
          },
        });
      }
      console.log('[Auth Service] User created successfully:', user.id);
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
        verificationExpires: expires,
        isVerified: false,
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

    console.log('[Auth Service] Registration completed successfully');
    // Return only success message - NO JWT token until email is verified
    return { 
      message: 'Verification email sent'
    };
  }

  async login(email, password) {
    // Enforce exact order: a. Find user, b. If not verified → reject, c. If locked → reject, d. Verify password, e. Generate JWT
    
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
        isVerified: true,
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

    // b. If not verified → reject
    if (user.isVerified === false) {
      throw new Error(genericError);
    }

    // c. If locked → reject
    const now = new Date();
    if (user.isLockedUntil && now < user.isLockedUntil) {
      throw new Error(genericError);
    }

    // d. Verify password
    const pepper = process.env.PASSWORD_PEPPER;
    const isPasswordValid = await argon2.verify(user.password, password + (pepper || ''));

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

    // Password is correct - reset failed login attempts
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        isLockedUntil: null,
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
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Try to get additional fields if they exist in the database
    // This provides backward compatibility during migration
    try {
      const fullUser = await db.user.findUnique({
        where: { id: userId },
        select: {
          dateOfBirth: true,
          address: true,
        },
      });
      if (fullUser) {
        return { ...user, dateOfBirth: fullUser.dateOfBirth, address: fullUser.address };
      }
    } catch (e) {
      // Fields don't exist yet, return basic user
      console.log('[Auth Service] dateOfBirth/address fields not yet in database');
    }

    return user;
  }

  async updateProfile(userId, updates) {
    const { name, avatar } = updates;

    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
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
    if (user.verificationExpires && now > user.verificationExpires) {
      console.error('[Auth Service] Verification token expired for userId:', user.id);
      throw new Error('Verification token has expired');
    }

    // Check if already verified
    if (user.isVerified) {
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
    // Update user: set isVerified = true, clear token fields
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpires: null,
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

    // Hash new password with Argon2id
    const pepper = process.env.PASSWORD_PEPPER;
    const hashedPassword = await argon2.hash(newPassword + (pepper || ''), {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64MB
      timeCost: 3,
      parallelism: 1,
    });

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
      },
    });

    console.log(`[Auth Service] Password reset successful for userId=${user.id}`);
    // Note: JWT tokens are stateless and cannot be invalidated server-side without a token blacklist.
    // Existing tokens will remain valid until expiry. The password change ensures no new logins
    // can occur with the old password, which is the primary security concern.
    
    return { message: 'Password reset successfully' };
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
              isVerified: true,
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
            isVerified: true, // Google accounts are pre-verified
          },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            createdAt: true,
            isVerified: true,
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

  if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
    console.error('[Auth Service] verifyEmailToken: Token expired for userId:', user.id);
    throw new Error('Verification token expired');
  }

  // Check if already verified
  if (user.isVerified) {
    console.log('[Auth Service] verifyEmailToken: Email already verified for userId:', user.id);
    return { message: 'Email already verified' };
  }

  console.log('[Auth Service] verifyEmailToken: Updating verification status');
  await db.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
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
      isVerified: true,
    },
  });

  if (!user) {
    console.error('[Auth Service] checkVerificationStatus: User not found for email:', email);
    throw new Error('User not found');
  }

  console.log('[Auth Service] checkVerificationStatus: User found, isVerified:', user.isVerified);
  
  return {
    email: user.email,
    emailVerified: user.isVerified,
    isVerified: user.isVerified, // Alias for compatibility
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
      isVerified: true,
      verificationExpires: true,
    },
  });

  if (!user) {
    console.error('[Auth Service] resendVerificationEmail: User not found for email:', email);
    throw new Error('User not found');
  }

  if (user.isVerified) {
    console.log('[Auth Service] resendVerificationEmail: Email already verified for userId:', user.id);
    throw new Error('Email is already verified');
  }

  // Rate limiting: Check if verification email was sent recently (within last 60 seconds)
  if (user.verificationExpires) {
    const now = new Date();
    const timeSinceLastEmail = now.getTime() - user.verificationExpires.getTime();
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
      verificationExpires: expires,
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

