import { Context, Next } from 'hono';
import { createErrorResponse } from '../utils';
import { verify } from 'hono/jwt';

interface AuthUser {
  id: string;
  email: string;
  password: string;
  role: string;
}

// Mock user database - in a real app, this would be a database query
const users: AuthUser[] = [
  {
    id: 'user1',
    email: 'user@example.com',
    password: 'hashed_password',
    role: 'user',
  },
  {
    id: 'admin1',
    email: 'admin@example.com',
    password: 'hashed_password',
    role: 'admin',
  },
];

/**
 * Get JWT secret from environment or throw in production.
 * In development, falls back to a dev secret only if explicitly enabled.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    const devSecret = process.env.DEV_JWT_SECRET;
    if (!devSecret) {
      throw new Error('JWT_SECRET or DEV_JWT_SECRET must be set');
    }
    console.warn('⚠️ Using DEV_JWT_SECRET - not suitable for production');
    return devSecret;
  }
  
  return secret;
}

/**
 * Authentication middleware
 * @param roles - Allowed roles for the route
 * @returns Hono middleware function
 */
export function authMiddleware(roles: string[] = ['user']) {
  return async (c: Context, next: Next) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createErrorResponse(c, 'UNAUTHORIZED', 'No token provided', 401);
      }

      const token = authHeader.split(' ')[1];

      // Verify token with proper secret handling
      const payload = await verify(token, getJwtSecret(), 'HS256');

      const user = users.find((u) => u.id === payload.id);
      if (!user) {
        return createErrorResponse(c, 'UNAUTHORIZED', 'Invalid token', 401);
      }

      if (!roles.includes(user.role)) {
        return createErrorResponse(c, 'FORBIDDEN', 'Insufficient permissions', 403);
      }

      c.set('user' as never, user as never);
      await next();
    } catch (error) {
      return createErrorResponse(c, 'UNAUTHORIZED', 'Invalid token', 401);
    }
  };
}

/**
 * Admin-only authentication middleware
 */
export function adminMiddleware() {
  return authMiddleware(['admin']);
}