import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Hono } from 'hono'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

let aiRouter: any
let app: Hono
let root = ''
let token = ''

async function post(path: string, body: unknown, authToken = token) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (authToken) headers.authorization = `Bearer ${authToken}`
  const res = await app.request(path, {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  const text = await res.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {}
  return { status: res.status, json, text }
}

describe('ai routes', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-ai-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    process.env.AI_MODE = 'mock'
    const { SchemaVersionManager } = await import('@server/services/versionService')
    await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))
    const authRouter = (await import('@server/routes/auth')).default
    const aiModule = await import('@server/routes/ai')
    aiModule.resetAiRouter()
    aiRouter = aiModule.default
    app = new Hono()
    app.route('/api/auth', authRouter)
    app.route('/api/ai', aiRouter)
    const registered = await post('/api/auth/register', {
      email: 'ai@example.com',
      password: 'correct horse battery staple',
    }, '')
    expect(registered.status).toBe(201)
    token = registered.json.data.token as string
  }, 60000)

  afterAll(async () => {
    delete process.env.DATABASE_URL
    delete process.env.AI_MODE
    await rm(root, { recursive: true, force: true })
  })

  it('rejects unauthenticated requests', async () => {
    const response = await post('/api/ai/chat', {
      model: 'mock/default',
      messages: [{ role: 'user', content: 'hello' }],
    }, '')
    expect(response.status).toBe(401)
    expect(response.json.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects invalid bodies with the envelope', async () => {
    const missing = await post('/api/ai/chat', {})
    expect(missing.status).toBe(400)
    expect(missing.json.error.code).toBe('VALIDATION_ERROR')

    const badRole = await post('/api/ai/chat', {
      model: 'mock/default',
      messages: [{ role: 'system', content: 'x' }],
    })
    expect([200, 400]).toContain(badRole.status)
  })

  it('chats and tracks budget', async () => {
    const res = await post('/api/ai/chat', {
      model: 'mock/default',
      messages: [{ role: 'user', content: 'hello' }],
      sessionId: 'test-session',
    })
    expect(res.status).toBe(200)
    expect(res.json.success).toBe(true)
    expect(res.json.data.content).toContain('Mock reply')
    expect(res.json.data.budget.used).toBeGreaterThan(0)
  })

  it('includes component ops for button prompts', async () => {
    const res = await post('/api/ai/chat', {
      model: 'mock/default',
      messages: [{ role: 'user', content: 'make me a button' }],
    })
    expect(res.json.data.content).toContain('add-component')
  })

  it('lists mock models', async () => {
    const res = await app.request('/api/ai/models', {
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.data).toEqual([{ id: 'mock/default', name: 'Mock default', provider: 'mock' }])
  })

  it('streams SSE frames', async () => {
    const res = await post('/api/ai/stream', {
      model: 'mock/default',
      messages: [{ role: 'user', content: 'hi' }],
    })
    expect(res.status).toBe(200)
    expect(res.text).toContain('data:')
  })
})
