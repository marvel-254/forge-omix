import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setTimeout as sleep } from 'node:timers/promises'
import { Hono } from 'hono'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

let app: Hono
let root = ''
let token = ''

async function post(body: unknown, authToken = token) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (authToken) headers.authorization = `Bearer ${authToken}`
  const res = await app.request('/api/feedback', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return { status: res.status, json: (await res.json()) as any }
}

describe('feedback routes', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-feedback-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { SchemaVersionManager } = await import('@server/services/versionService')
    await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))
    const authRouter = (await import('@server/routes/auth')).default
    const feedbackRouter = (await import('@server/routes/feedback')).default
    app = new Hono()
    app.route('/api/auth', authRouter)
    app.route('/api/feedback', feedbackRouter)
    const registered = await post({
      kind: 'bug',
      message: 'Registration',
    }, '')
    expect(registered.status).toBe(401)
    const registeredResponse = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'feedback@example.com', password: 'correct horse battery staple' }),
    })
    const registeredJson = (await registeredResponse.json()) as any
    expect(registeredResponse.status).toBe(201)
    token = registeredJson.data.token as string
  }, 60000)

  afterAll(async () => {
    delete process.env.DATABASE_URL
    await rm(root, { recursive: true, force: true })
  })

  it('rejects unauthenticated submissions', async () => {
    const response = await post({ kind: 'bug', message: 'No session' }, '')
    expect(response.status).toBe(401)
    expect(response.json.error.code).toBe('UNAUTHORIZED')
  })

  it('accepts validated submissions and lists them newest-first', async () => {
    const first = await post({ kind: 'bug', message: 'Canvas froze', contact: 'a@b.c' })
    expect(first.status).toBe(201)
    expect(first.json.data.id).toBeTruthy()

    await sleep(5)
    const second = await post({ kind: 'idea', message: 'Dark mode please' })
    expect(second.status).toBe(201)

    const listed = await app.request('/api/feedback', { headers: { authorization: `Bearer ${token}` } })
    expect(listed.status).toBe(200)
    const rows = ((await listed.json()) as any).data as Array<{ message: string }>
    expect(rows.map((row) => row.message)).toEqual(['Dark mode please', 'Canvas froze'])
  })

  it('rejects invalid submissions with the envelope', async () => {
    const badKind = await post({ kind: 'spam', message: 'x' })
    expect(badKind.status).toBe(400)
    expect(badKind.json.error.code).toBe('VALIDATION_ERROR')

    const empty = await post({ kind: 'bug', message: '' })
    expect(empty.status).toBe(400)

    const tooLong = await post({ kind: 'bug', message: 'x'.repeat(2001) })
    expect(tooLong.status).toBe(400)
  })
})
