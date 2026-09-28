import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { createApiResponse, createErrorResponse } from '../utils'
import { createValidationMiddleware } from '../middleware/validation'
import { authMiddleware, getSessionToken, type AuthEnv } from '../middleware/authMiddleware'
import {
  createSession,
  hashPassword,
  revokeSession,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  verifyPassword,
} from '../services/authService'
import { accounts, type AuthAccount } from '../db/schema'
import { db } from '../db'
import { eq } from 'drizzle-orm'

const router = new Hono<AuthEnv>()

const registrationSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(256),
  displayName: z.string().trim().min(1).max(100).optional(),
})

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(256),
})

function publicAccount(account: AuthAccount) {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
    role: account.role,
  }
}

function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

router.post('/register', createValidationMiddleware(registrationSchema), async (c) => {
  try {
    const input = c.get('validatedData') as z.infer<typeof registrationSchema>
    const email = input.email.trim().toLowerCase()
    const existing = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.email, email)).get()
    if (existing) return createErrorResponse(c, 'ACCOUNT_EXISTS', 'An account with this email already exists', undefined, 409)

    const now = new Date()
    const account = await db
      .insert(accounts)
      .values({
        id: crypto.randomUUID(),
        email,
        displayName: input.displayName?.trim() ?? null,
        passwordHash: await hashPassword(input.password),
        role: 'user',
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get()
    const token = await createSession(account.id)
    setSessionCookie(c, token)
    return createApiResponse(c, { token, user: publicAccount(account) }, 201)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Registration failed', undefined, 500)
  }
})

router.post('/login', createValidationMiddleware(loginSchema), async (c) => {
  try {
    const input = c.get('validatedData') as z.infer<typeof loginSchema>
    const email = input.email.trim().toLowerCase()
    const account = await db.select().from(accounts).where(eq(accounts.email, email)).get()
    if (!account || !(await verifyPassword(input.password, account.passwordHash))) {
      return createErrorResponse(c, 'UNAUTHORIZED', 'Invalid credentials', undefined, 401)
    }

    const token = await createSession(account.id)
    setSessionCookie(c, token)
    return createApiResponse(c, { token, user: publicAccount(account) })
  } catch (error) {
    return createErrorResponse(c, 'INTERNAL_SERVER_ERROR', 'Login failed', undefined, 500)
  }
})

router.get('/me', authMiddleware(), async (c) => {
  const account = c.get('account')
  if (!account) return createErrorResponse(c, 'UNAUTHORIZED', 'Authentication required', undefined, 401)
  return createApiResponse(c, { user: publicAccount(account) })
})

router.post('/logout', authMiddleware(), async (c) => {
  const token = getSessionToken(c)
  if (token) await revokeSession(token)
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return createApiResponse(c, { loggedOut: true })
})

export default router
