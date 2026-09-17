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
    password: 'hashed_password', // In real app, this would be a hashed password
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
 * Authentication middleware
 * @param roles - Allowed roles for the route
 * @returns Hono middleware function
 */
export function authMiddleware(roles: string[] = ['user']) {
  return async (c: Context, next: Next) => {
    try {
      // Get token from Authorization header
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createErrorResponse(c, 'UNAUTHORIZED', 'No token provided', 401);
      }

      const token = authHeader.split(' ')[1];

      // Verify token
      const payload = await verify(token, process.env.JWT_SECRET || 'secret', 'HS256');

      // Check if user exists
      const user = users.find((u) => u.id === payload.id);
      if (!user) {
        return createErrorResponse(c, 'UNAUTHORIZED', 'Invalid token', 401);
      }

      // Check if user has required role
      if (!roles.includes(user.role)) {
        return createErrorResponse(c, 'FORBIDDEN', 'Insufficient permissions', 403);
      }

      // Attach user to context
      c.set('user' as never, user as never);
      await next();
    } catch (error) {
      return createErrorResponse(c, 'UNAUTHORIZED', 'Invalid token', 401);
    }
  };
}

/**
 * Admin-only authentication middleware
 * @returns Hono middleware function
 */
export function adminMiddleware() {
  return authMiddleware(['admin']);
}
