import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { createValidationMiddleware } from '@server/middleware/validation'
import { pageSchema } from '@/lib/validations'

function buildApp() {
  const app = new Hono<{ Variables: { validatedData?: unknown } }>()
  app.post('/pages', createValidationMiddleware(pageSchema), (c) => {
    return c.json({ success: true, data: c.get('validatedData') }, 201)
  })
  return app
}

describe('createValidationMiddleware failure paths', () => {
  it('passes valid bodies through with 201', async () => {
    const app = buildApp()
    const res = await app.request('/pages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj_abc123456', path: '/', title: 'Home' }),
    })
    expect(res.status).toBe(201)
    const json = (await res.json()) as { success: boolean }
    expect(json.success).toBe(true)
  })

  it('returns 400 VALIDATION_ERROR for schema violations', async () => {
    const app = buildApp()
    const res = await app.request('/pages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: 'no-slash', title: 'Home' }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as {
      success: boolean
      error: { code: string; message: string; details: unknown[] }
    }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.details.length).toBeGreaterThan(0)
  })

  it('returns 400 INVALID_JSON for malformed bodies', async () => {
    const app = buildApp()
    const res = await app.request('/pages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad json',
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INVALID_JSON')
  })
})
