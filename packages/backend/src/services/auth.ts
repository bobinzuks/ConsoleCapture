/**
 * Authentication service
 * Handles JWT, OAuth (Google, GitHub), and SAML authentication
 */

import { User, UserRole } from '@console-capture/shared';
import { logger } from '@console-capture/shared';
import { getDatabase } from '../db';
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyJWT,
  generateRandomToken,
  JWTPayload,
} from '../utils/crypto';
import { setSession, getSession, deleteSession } from './redis';
import config from '../config';

/**
 * Registration
 */

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export async function register(input: RegisterInput): Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
}> {
  const db = getDatabase();

  // Check if user already exists
  const existingUser = await db('users')
    .where({ email: input.email })
    .first();

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Generate email verification token
  const emailVerificationToken = generateRandomToken();

  // Create user
  const [user] = await db('users')
    .insert({
      email: input.email,
      password_hash: passwordHash,
      name: input.name,
      role: UserRole.FREE,
      email_verified: false,
      email_verification_token: emailVerificationToken,
      is_active: true,
    })
    .returning('*');

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(
    user.id,
    user.email,
    user.role,
    user.organization_id
  );

  // Store refresh token in Redis
  await setSession(`refresh:${user.id}`, { refreshToken }, 30 * 24 * 3600); // 30 days

  logger.info('User registered', { userId: user.id, email: user.email });

  // TODO: Send verification email
  // await sendVerificationEmail(user.email, emailVerificationToken);

  return {
    user: mapUserFromDb(user),
    accessToken,
    refreshToken,
  };
}

/**
 * Login
 */

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
}> {
  const db = getDatabase();

  // Find user
  const dbUser = await db('users')
    .where({ email: input.email })
    .first();

  if (!dbUser) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  if (!dbUser.password_hash) {
    throw new Error('Password login not available for this account');
  }

  const isValidPassword = await verifyPassword(input.password, dbUser.password_hash);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!dbUser.is_active) {
    throw new Error('Account is deactivated');
  }

  // Update last login
  await db('users')
    .where({ id: dbUser.id })
    .update({
      last_login_at: db.fn.now(),
    });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(
    dbUser.id,
    dbUser.email,
    dbUser.role,
    dbUser.organization_id
  );

  // Store refresh token in Redis
  await setSession(`refresh:${dbUser.id}`, { refreshToken }, 30 * 24 * 3600);

  logger.info('User logged in', { userId: dbUser.id, email: dbUser.email });

  return {
    user: mapUserFromDb(dbUser),
    accessToken,
    refreshToken,
  };
}

/**
 * Logout
 */

export async function logout(userId: string): Promise<void> {
  // Remove refresh token from Redis
  await deleteSession(`refresh:${userId}`);
  logger.info('User logged out', { userId });
}

/**
 * Refresh token
 */

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // Verify refresh token
  let payload: JWTPayload;
  try {
    payload = verifyJWT(refreshToken);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }

  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  // Check if refresh token exists in Redis
  const session = await getSession<{ refreshToken: string }>(`refresh:${payload.sub}`);

  if (!session || session.refreshToken !== refreshToken) {
    throw new Error('Refresh token not found or expired');
  }

  // Get user to ensure they still exist and are active
  const db = getDatabase();
  const dbUser = await db('users')
    .where({ id: payload.sub })
    .first();

  if (!dbUser || !dbUser.is_active) {
    throw new Error('User not found or inactive');
  }

  // Generate new token pair
  const tokens = generateTokenPair(
    dbUser.id,
    dbUser.email,
    dbUser.role,
    dbUser.organization_id
  );

  // Update refresh token in Redis
  await setSession(`refresh:${dbUser.id}`, { refreshToken: tokens.refreshToken }, 30 * 24 * 3600);

  return tokens;
}

/**
 * Verify email
 */

export async function verifyEmail(token: string): Promise<User> {
  const db = getDatabase();

  const dbUser = await db('users')
    .where({ email_verification_token: token })
    .first();

  if (!dbUser) {
    throw new Error('Invalid verification token');
  }

  // Update user
  await db('users')
    .where({ id: dbUser.id })
    .update({
      email_verified: true,
      email_verified_at: db.fn.now(),
      email_verification_token: null,
    });

  logger.info('Email verified', { userId: dbUser.id });

  return mapUserFromDb({ ...dbUser, email_verified: true });
}

/**
 * Request password reset
 */

export async function requestPasswordReset(email: string): Promise<void> {
  const db = getDatabase();

  const dbUser = await db('users')
    .where({ email })
    .first();

  if (!dbUser) {
    // Don't reveal if user exists
    logger.info('Password reset requested for non-existent email', { email });
    return;
  }

  // Generate reset token
  const resetToken = generateRandomToken();
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  // Update user
  await db('users')
    .where({ id: dbUser.id })
    .update({
      password_reset_token: resetToken,
      password_reset_expires: expiresAt,
    });

  logger.info('Password reset token generated', { userId: dbUser.id });

  // TODO: Send reset email
  // await sendPasswordResetEmail(email, resetToken);
}

/**
 * Reset password
 */

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const db = getDatabase();

  const dbUser = await db('users')
    .where({ password_reset_token: token })
    .where('password_reset_expires', '>', db.fn.now())
    .first();

  if (!dbUser) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user
  await db('users')
    .where({ id: dbUser.id })
    .update({
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires: null,
    });

  logger.info('Password reset completed', { userId: dbUser.id });
}

/**
 * OAuth: Google
 */

export async function authenticateWithGoogle(googleProfile: {
  id: string;
  email: string;
  name: string;
  picture?: string;
}): Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}> {
  const db = getDatabase();

  // Check if user exists
  let dbUser = await db('users')
    .where({ email: googleProfile.email })
    .first();

  let isNewUser = false;

  if (!dbUser) {
    // Create new user
    [dbUser] = await db('users')
      .insert({
        email: googleProfile.email,
        name: googleProfile.name,
        avatar_url: googleProfile.picture,
        role: UserRole.FREE,
        email_verified: true, // Google emails are pre-verified
        email_verified_at: db.fn.now(),
        is_active: true,
        metadata: {
          oauth_provider: 'google',
          oauth_id: googleProfile.id,
        },
      })
      .returning('*');

    isNewUser = true;
    logger.info('New user created via Google OAuth', { userId: dbUser.id });
  } else {
    // Update last login
    await db('users')
      .where({ id: dbUser.id })
      .update({
        last_login_at: db.fn.now(),
      });

    logger.info('User logged in via Google OAuth', { userId: dbUser.id });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(
    dbUser.id,
    dbUser.email,
    dbUser.role,
    dbUser.organization_id
  );

  // Store refresh token in Redis
  await setSession(`refresh:${dbUser.id}`, { refreshToken }, 30 * 24 * 3600);

  return {
    user: mapUserFromDb(dbUser),
    accessToken,
    refreshToken,
    isNewUser,
  };
}

/**
 * SAML Authentication
 */

export async function authenticateWithSAML(samlProfile: {
  nameID: string;
  email: string;
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, any>;
}): Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}> {
  const db = getDatabase();

  // Check if user exists
  let dbUser = await db('users')
    .where({ email: samlProfile.email })
    .first();

  let isNewUser = false;

  if (!dbUser) {
    // Create new user
    const name = [samlProfile.firstName, samlProfile.lastName]
      .filter(Boolean)
      .join(' ') || samlProfile.email;

    [dbUser] = await db('users')
      .insert({
        email: samlProfile.email,
        name,
        role: UserRole.FREE,
        email_verified: true, // SAML emails are pre-verified
        email_verified_at: db.fn.now(),
        is_active: true,
        metadata: {
          saml_name_id: samlProfile.nameID,
          saml_attributes: samlProfile.attributes,
        },
      })
      .returning('*');

    isNewUser = true;
    logger.info('New user created via SAML', { userId: dbUser.id });
  } else {
    // Update last login
    await db('users')
      .where({ id: dbUser.id })
      .update({
        last_login_at: db.fn.now(),
      });

    logger.info('User logged in via SAML', { userId: dbUser.id });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(
    dbUser.id,
    dbUser.email,
    dbUser.role,
    dbUser.organization_id
  );

  // Store refresh token in Redis
  await setSession(`refresh:${dbUser.id}`, { refreshToken }, 30 * 24 * 3600);

  return {
    user: mapUserFromDb(dbUser),
    accessToken,
    refreshToken,
    isNewUser,
  };
}

/**
 * Get user by ID
 */

export async function getUserById(userId: string): Promise<User | null> {
  const db = getDatabase();

  const dbUser = await db('users')
    .where({ id: userId })
    .first();

  if (!dbUser) {
    return null;
  }

  return mapUserFromDb(dbUser);
}

/**
 * Helper: Map database user to User type
 */

function mapUserFromDb(dbUser: any): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    organizationId: dbUser.organization_id,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    emailVerified: dbUser.email_verified,
    avatarUrl: dbUser.avatar_url,
    metadata: dbUser.metadata,
  };
}
