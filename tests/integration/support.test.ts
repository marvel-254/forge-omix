import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { sql } from 'drizzle-orm'

let app: Hono
let root = ''
let alice = ''
let bob = ''
let admin = ''

async function register(email: string) {
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'correct horse battery staple' }),
  })
  expect(response.status).toBe(201)
  return ((await response.json()) as any).data.token as string
}

async function call(path: string, token: string, method = 'GET', body?: unknown) {
  const response = await app.request(path, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { status: response.status, json: (await response.json()) as any }
}

describe('account support tickets', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-support-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { SchemaVersionManager } = await import('@server/services/versionService')
    await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))
    const authRouter = (await import('@server/routes/auth')).default
    const supportRouter = (await import('@server/routes/support')).default
    app = new Hono()
    app.route('/api/auth', authRouter)
    app.route('/api/support', supportRouter)
    alice = await register('alice-support@example.com')
    bob = await register('bob-support@example.com')
    admin = await register('admin-support@example.com')
    const { db } = await import('@server/db')
    await db.run(sql`UPDATE accounts SET role = 'admin' WHERE email = 'admin-support@example.com'`)
  }, 60000)

  afterAll(async () => {
    delete process.env.DATABASE_URL
    if (root) await rm(root, { recursive: true, force: true })
  })

  it('keeps ticket threads private between accounts and hides internal notes', async () => {
    const created = await call('/api/support', alice, 'POST', {
      subject: 'Deployment is stuck', category: 'deployment', message: 'The build has not moved in ten minutes.',
    })
    expect(created.status).toBe(201)
    const ticketId = created.json.data.id as string

    expect((await call('/api/support', bob)).json.data).toHaveLength(0)
    expect((await call(`/api/support/${ticketId}`, bob)).status).toBe(404)
    expect((await call(`/api/support/${ticketId}/replies`, bob, 'POST', { body: 'Can I see this?' })).status).toBe(404)

    const note = await call(`/api/support/${ticketId}/admin-replies`, admin, 'POST', {
      body: 'Inspect deployment worker queue.', internal: true,
    })
    expect(note.status).toBe(201)
    const customerThread = await call(`/api/support/${ticketId}`, alice)
    expect(customerThread.json.data.messages.map((item: { body: string }) => item.body))
      .toEqual(['The build has not moved in ten minutes.'])
    const adminThread = await call(`/api/support/${ticketId}`, admin)
    expect(adminThread.json.data.messages).toHaveLength(2)
    expect(adminThread.json.data.messages[1].internal).toBe(true)
  })

  it('allows admins to triage while rejecting customer status changes', async () => {
    const created = await call('/api/support', alice, 'POST', {
      subject: 'Account question', category: 'account', message: 'Please help with my account.',
    })
    const id = created.json.data.id as string

    expect((await call(`/api/support/${id}`, alice, 'PATCH', { status: 'closed' })).status).toBe(403)
    expect((await call(`/api/support/${id}`, admin, 'PATCH', { status: 'resolved', priority: 'high' })).status).toBe(200)
    expect((await call(`/api/support/${id}`, alice)).json.data).toMatchObject({ status: 'resolved', priority: 'high' })
    expect((await call(`/api/support/${id}/reopen`, alice, 'POST')).json.data.reopened).toBe(true)
    expect((await call(`/api/support/${id}`, alice)).json.data.status).toBe('open')
  })

  it('validates ticket fields and requires an authenticated account', async () => {
    expect((await call('/api/support', '', 'POST', { subject: 'x', category: 'unknown', message: '' })).status).toBe(401)
    expect((await call('/api/support', alice, 'POST', { subject: 'x', category: 'other', message: '' })).status).toBe(400)
  })
})
