import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { createApiResponse, createErrorResponse } from '../utils';
import { z } from 'zod';
import { createValidationMiddleware } from '../middleware/validation';

interface MockUser {
  id: string;
  email: string;
  password: string;
  role: string;
}

// Mock user database - in a real app, this would be a database query
const users: MockUser[] = [
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

interface AuthEnv {
  Variables: {
    validatedData?: unknown;
    user?: MockUser;
  };
}

const router = new Hono<AuthEnv>();

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Login route
router.post(
  '/login',
  createValidationMiddleware(loginSchema),
  async (c) => {
    try {
      const { email, password } = c.get('validatedData') as { email: string; password: string };

      // Find user
      const user = users.find((u) => u.email === email);
      if (!user) {
        return createErrorResponse(c, 'UNAUTHORIZED', 'Invalid credentials', 401);
      }

      // Check password (in real app, compare hashed passwords)
      if (user.password !== password) {
        return createErrorResponse(c, 'UNAUTHORIZED', 'Invalid credentials', 401);
      }

      // Create JWT token
      const token = await sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret'
      );

      return createApiResponse(c, {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      return createErrorResponse(c, 'INTERNAL_SERVER_ERROR', 'Login failed', 500);
    }
  }
);

export default router;
