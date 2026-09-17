import type { Context, Next } from 'hono'

/**
 * In-memory rate limiter (simple sliding window per IP)
 * For production, use Redis or a dedicated service
 */
interface RateLimitStore {
  [key: string]: number[]
}

const store: RateLimitStore = {}

/**
 * Rate limiting middleware: 100 requests per 15 minutes per IP
 * Uses sliding window algorithm
 */
export function rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const now = Date.now()
    const key = `ratelimit:${ip}`

    // Initialize or get existing requests
    if (!store[key]) {
      store[key] = []
    }

    const requests = store[key]

    // Remove requests outside the window
    store[key] = requests.filter((timestamp) => now - timestamp < windowMs)

    // Check if limit exceeded
    if (store[key].length >= maxRequests) {
      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
          },
        },
        429
      )
    }

    // Add current request
    store[key].push(now)

    // Set response headers
    c.header('X-RateLimit-Limit', maxRequests.toString())
    c.header('X-RateLimit-Remaining', (maxRequests - store[key].length).toString())
    c.header('X-RateLimit-Reset', (now + windowMs).toString())

    await next()
  }
}

/**
 * Cleanup old entries every hour to prevent memory leak
 */
export function cleanupRateLimitStore() {
  setInterval(() => {
    const now = Date.now()
    const windowMs = 15 * 60 * 1000

    for (const [key, requests] of Object.entries(store)) {
      const active = requests.filter((timestamp) => now - timestamp < windowMs)
      if (active.length === 0) {
        delete store[key]
      } else {
        store[key] = active
      }
    }
  }, 60 * 60 * 1000) // Run every hour
}