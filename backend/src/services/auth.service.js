import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import prisma from '../config/prismaClient.js';
import { generateToken } from '../utils/jwt.js';
import { sendVerificationEmail } from '../utils/email.js';

class AuthService {
  async register(userData) {
    const { email, password, name } = userData;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password with Argon2id
    const pepper = process.env.PASSWORD_PEPPER;
    const hashedPassword = await argon2.hash(password + pepper, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64MB
      timeCost: 3,
      parallelism: 1,
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate verification token
    const verificationToken = uuidv4();
    const expires = add(new Date(), { minutes: 30 });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verificationToken,
        verificationExpires: expires,
        isVerified: false,
      },
    });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.name);

    // Generate JWT token
    const authToken = generateToken({ userId: user.id, email: user.email, role: user.role });

    // Return user with emailVerified status
    return { 
      user: {
        ...user,
        isVerified: false,
        emailVerified: false,
      }, 
      token: authToken,
      emailVerified: false,
      isVerified: false,
    };
  }

  async login(email, password) {
    // Find user
    const user = await prisma.user.findUnique({
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

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    const now = new Date();
    if (user.isLockedUntil && now < user.isLockedUntil) {
      throw new Error('Account temporarily locked. Try again later.');
    }

    // Check if email is verified
    if (user.isVerified === false) {
      throw new Error('Email not verified');
    }

    // Verify password with Argon2id
    const pepper = process.env.PASSWORD_PEPPER;
    const isPasswordValid = await argon2.verify(user.password, password + pepper);

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
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new Error('Invalid email or password');
    }

    // Password is correct - reset failed login attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        isLockedUntil: null,
      },
    });

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    // Generate JWT token
    const authToken = generateToken({ userId: user.id, email: user.email, role: user.role });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return { token: authToken, user: userWithoutPassword };
  }

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateProfile(userId, updates) {
    const { name, avatar } = updates;

    const user = await prisma.user.update({
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
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new Error('Invalid verification token');
    }

    const now = new Date();
    if (user.verificationExpires && now > user.verificationExpires) {
      throw new Error('Verification token has expired');
    }

    // Update user: set isVerified = true, clear token fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }
}

export async function verifyEmailToken(token) {
  const user = await prisma.user.findFirst({ where: { verificationToken: token } });
  if (!user) throw new Error('Invalid verification token');

  if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
    throw new Error('Verification token expired');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
    },
  });

  return true;
}

export async function checkVerificationStatus(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    email: user.email,
    emailVerified: user.isVerified,
    isVerified: user.isVerified, // Alias for compatibility
  };
}

export async function resendVerificationEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isVerified) {
    throw new Error('Email is already verified');
  }

  // Generate new verification token
  const verificationToken = uuidv4();
  const expires = add(new Date(), { minutes: 30 });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken: verificationToken,
      verificationExpires: expires,
    },
  });

  // Send verification email
  await sendVerificationEmail(user.email, verificationToken, user.name);

  return { message: 'Verification email sent' };
}

export default new AuthService();

