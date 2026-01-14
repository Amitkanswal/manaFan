import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { signToken, getTokenExpiry, verifyToken } from './jwt';
import { sendMagicLinkEmail, sendWelcomeEmail } from './email';
import { AuthUser, LoginResponse, MagicLinkResponse, JWTPayload } from './types';

const MAGIC_LINK_EXPIRES_MINUTES = parseInt(process.env.MAGIC_LINK_EXPIRES_MINUTES || '15', 10);
const SALT_ROUNDS = 12;

// ============================================
// USER HELPERS
// ============================================

function toAuthUser(user: {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  emailUpdatesOptIn: boolean;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    emailUpdatesOptIn: user.emailUpdatesOptIn,
    createdAt: user.createdAt,
  };
}

// ============================================
// REGISTRATION & LOGIN
// ============================================

export async function registerUser(
  email: string,
  password?: string,
  name?: string
): Promise<LoginResponse> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return {
        success: false,
        message: 'An account with this email already exists.',
      };
    }

    // Create user
    const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        emailVerified: false,
      },
    });

    // Create session
    const sessionId = uuidv4();
    const token = signToken({ userId: user.id, email: user.email, sessionId });
    const expiresAt = getTokenExpiry();

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, name || null).catch(console.error);

    return {
      success: true,
      message: 'Account created successfully!',
      user: toAuthUser(user),
      token,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Failed to create account. Please try again.',
    };
  }
}

export async function loginWithPassword(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return {
        success: false,
        message: 'Invalid email or password.',
      };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid email or password.',
      };
    }

    // Create session
    const sessionId = uuidv4();
    const token = signToken({ userId: user.id, email: user.email, sessionId });
    const expiresAt = getTokenExpiry();

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      success: true,
      message: 'Logged in successfully!',
      user: toAuthUser(user),
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Failed to log in. Please try again.',
    };
  }
}

// ============================================
// MAGIC LINK AUTHENTICATION
// ============================================

export async function requestMagicLink(email: string): Promise<MagicLinkResponse> {
  try {
    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Create new user for magic link auth
      user = await prisma.user.create({
        data: {
          email,
          emailVerified: false,
        },
      });
    }

    // Invalidate existing magic links
    await prisma.magicLink.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Create new magic link
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRES_MINUTES * 60 * 1000);

    await prisma.magicLink.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email
    const sent = await sendMagicLinkEmail(email, token);
    if (!sent) {
      return {
        success: false,
        message: 'Failed to send magic link. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Magic link sent! Check your email.',
    };
  } catch (error) {
    console.error('Magic link error:', error);
    return {
      success: false,
      message: 'Failed to send magic link. Please try again.',
    };
  }
}

export async function verifyMagicLink(token: string): Promise<LoginResponse> {
  try {
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      return {
        success: false,
        message: 'Invalid or expired magic link.',
      };
    }

    if (magicLink.usedAt) {
      return {
        success: false,
        message: 'This magic link has already been used.',
      };
    }

    if (new Date() > magicLink.expiresAt) {
      return {
        success: false,
        message: 'This magic link has expired.',
      };
    }

    // Mark magic link as used
    await prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

    // Verify email if not already
    const user = await prisma.user.update({
      where: { id: magicLink.userId },
      data: {
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    });

    // Create session
    const sessionId = uuidv4();
    const sessionToken = signToken({ userId: user.id, email: user.email, sessionId });
    const expiresAt = getTokenExpiry();

    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
      },
    });

    // Send welcome email for new users
    if (!magicLink.user.emailVerified) {
      sendWelcomeEmail(user.email, user.name).catch(console.error);
    }

    return {
      success: true,
      message: 'Successfully signed in!',
      user: toAuthUser(user),
      token: sessionToken,
    };
  } catch (error) {
    console.error('Magic link verification error:', error);
    return {
      success: false,
      message: 'Failed to verify magic link. Please try again.',
    };
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function validateSession(token: string): Promise<AuthUser | null> {
  try {
    const payload = verifyToken(token);
    if (!payload) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || new Date() > session.expiresAt) {
      // Clean up expired session
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return null;
    }

    return toAuthUser(session.user);
  } catch {
    return null;
  }
}

export async function logout(token: string): Promise<boolean> {
  try {
    await prisma.session.delete({ where: { token } });
    return true;
  } catch {
    return false;
  }
}

export async function logoutAllSessions(userId: string): Promise<boolean> {
  try {
    await prisma.session.deleteMany({ where: { userId } });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// USER PROFILE
// ============================================

export async function getUserById(userId: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? toAuthUser(user) : null;
  } catch {
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    avatarUrl?: string;
    emailUpdatesOptIn?: boolean;
  }
): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    return toAuthUser(user);
  } catch {
    return null;
  }
}

export async function updatePassword(
  userId: string,
  newPassword: string
): Promise<boolean> {
  try {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// GUEST SESSION
// ============================================

export function createGuestSessionId(): string {
  return `guest_${uuidv4()}`;
}

