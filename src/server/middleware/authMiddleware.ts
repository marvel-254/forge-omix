import { getCookie } from 'hono/cookie'
import type { Context, MiddlewareHandler } from 'hono'
import { createErrorResponse } from '../utils'
import { findSession, SESSION_COOKIE } from '../services/authService'
import type { AuthAccount } from '../db/schema'

export interface AuthEnv {
  Variables: {
    validatedData?: unknown
    account?: AuthAccount
  }
}

export function getSessionToken(c: Context): string | null {
  const authorization = c.req.header('Authorization')
  if (authorization?.startsWith('Bearer ')) return authorization.slice('Bearer '.length).trim() || null
  return getCookie(c, SESSION_COOKIE) ?? null
}

export function authMiddleware(roles: string[] = ['user', 'admin']): MiddlewareHandler<AuthEnv> {
  return async (c, next) => {
    const token = getSessionToken(c)
    if (!token) return createErrorResponse(c, 'UNAUTHORIZED', 'Authentication required', undefined, 401)

    let account: AuthAccount | null
    try {
      account = await findSession(token)
    } catch {
      return createErrorResponse(c, 'UNAUTHORIZED', 'Invalid or expired session', undefined, 401)
    }
    if (!account) return createErrorResponse(c, 'UNAUTHORIZED', 'Invalid or expired session', undefined, 401)
    if (!roles.includes(account.role)) return createErrorResponse(c, 'FORBIDDEN', 'Insufficient permissions', undefined, 403)
    c.set('account', account)
    await next()
  }
}

export function adminMiddleware(): MiddlewareHandler<AuthEnv> {
  return authMiddleware(['admin'])
}
