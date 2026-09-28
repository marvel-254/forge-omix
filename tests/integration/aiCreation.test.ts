import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Hono } from 'hono'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { sql } from 'drizzle-orm'
import { ProjectSchema } from '@server/validation'

let app: Hono
let root = ''
let ownerToken = ''
let otherToken = ''

async function request(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  const response = await app.request(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, json: (await response.json()) as any }
}

describe('durable AI creation sessions', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-ai-creation-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { SchemaVersionManager } = await import('@server/services/versionService')
    expect(await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))).toBe(8)
    const authRouter = (await import('@server/routes/auth')).default
    const aiRouter = (await import('@server/routes/ai')).default
    app = new Hono()
    app.route('/api/auth', authRouter)
    app.route('/api/ai', aiRouter)

    const owner = await request('POST', '/api/auth/register', {
      email: 'ai-creation-owner@example.com',
      password: 'correct horse battery staple',
    })
    const other = await request('POST', '/api/auth/register', {
      email: 'ai-creation-other@example.com',
      password: 'correct horse battery staple',
    })
    ownerToken = owner.json.data.token as string
    otherToken = other.json.data.token as string
  }, 60000)

  afterAll(async () => {
    delete process.env.DATABASE_URL
    await rm(root, { recursive: true, force: true })
  })

  it('requires authentication and creates a durable draft session', async () => {
    const unauthorized = await request('POST', '/api/ai/creation/sessions', { brief: 'A portfolio' })
    expect(unauthorized.status).toBe(401)
    expect(unauthorized.json.error.code).toBe('UNAUTHORIZED')

    const created = await request(
      'POST',
      '/api/ai/creation/sessions',
      {
        brief: 'A portfolio for a photographer',
        projectName: 'Lens Journal',
        clarifications: { audience: 'independent photographers' },
        assets: { logo: { name: 'logo.svg', url: '/logo.svg', altText: 'Lens Journal' } },
      },
      ownerToken
    )
    expect(created.status).toBe(201)
    expect(created.json.success).toBe(true)
    expect(created.json.data.session).toMatchObject({
      status: 'draft',
      step: 'brief',
      brief: 'A portfolio for a photographer',
      projectName: 'Lens Journal',
      clarifications: { audience: 'independent photographers' },
      generatedProject: null,
      error: null,
    })
    expect(created.json.data.session.id).toBeTruthy()
    expect(new Date(created.json.data.session.createdAt).toISOString()).toBe(
      created.json.data.session.createdAt
    )
  })

  it('gets and partially updates a session', async () => {
    const created = await request(
      'POST',
      '/api/ai/creation/sessions',
      { brief: 'A calm booking site' },
      ownerToken
    )
    const id = created.json.data.session.id as string

    const fetched = await request('GET', `/api/ai/creation/sessions/${id}`, undefined, ownerToken)
    expect(fetched.status).toBe(200)
    expect(fetched.json.data.session.id).toBe(id)

    const updated = await request(
      'PATCH',
      `/api/ai/creation/sessions/${id}`,
      {
        step: 'review',
        projectName: 'Calm Booking',
        clarifications: {
          audience: 'therapists',
          primaryGoal: 'accept bookings',
          keyPages: 'home and availability',
          visualDirection: 'calm and editorial',
        },
        assets: {
          logo: { name: 'calm.svg', url: '/calm.svg', altText: 'Calm Booking' },
          photo: null,
        },
      },
      ownerToken
    )
    expect(updated.status).toBe(200)
    expect(updated.json.data.session).toMatchObject({
      status: 'draft',
      step: 'review',
      projectName: 'Calm Booking',
      generatedProject: null,
      error: null,
    })
    expect(updated.json.data.session.clarifications.primaryGoal).toBe('accept bookings')
    expect(updated.json.data.session.assets.photo).toBeNull()
  })

  it('generates a schema-valid deterministic starter project and reports conflicts', async () => {
    const created = await request(
      'POST',
      '/api/ai/creation/sessions',
      { brief: 'Build a booking site', projectName: 'Calm Booking' },
      ownerToken
    )
    const id = created.json.data.session.id as string
    const generated = await request('POST', `/api/ai/creation/sessions/${id}/generate`, undefined, ownerToken)
    expect(generated.status).toBe(200)
    expect(generated.json.data.session.status).toBe('ready')
    expect(generated.json.data.session.generatedProject).toMatchObject({
      name: 'Calm Booking',
      generation: {
        implementation: 'deterministic_starter',
        fullModelGeneration: false,
        providerHook: 'next-slice',
      },
    })
    expect(ProjectSchema.safeParse(generated.json.data.session.generatedProject).success).toBe(true)

    const conflict = await request('POST', `/api/ai/creation/sessions/${id}/generate`, undefined, ownerToken)
    expect(conflict.status).toBe(409)
    expect(conflict.json.error.code).toBe('AI_GENERATION_CONFLICT')
  })

  it('keeps sessions isolated between accounts', async () => {
    const created = await request(
      'POST',
      '/api/ai/creation/sessions',
      { brief: 'Private project' },
      ownerToken
    )
    const id = created.json.data.session.id as string

    expect((await request('GET', `/api/ai/creation/sessions/${id}`, undefined, otherToken)).status).toBe(404)
    expect(
      (await request('PATCH', `/api/ai/creation/sessions/${id}`, { brief: 'Stolen' }, otherToken)).status
    ).toBe(404)
    expect(
      (await request('POST', `/api/ai/creation/sessions/${id}/generate`, undefined, otherToken)).status
    ).toBe(404)
    expect((await request('GET', `/api/ai/creation/sessions/${id}`, undefined, ownerToken)).json.data.session.brief).toBe(
      'Private project'
    )
  })

  it('applies migration 0005 with the creation session table', async () => {
    const { db } = await import('@server/db')
    const tables = await db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`)
    expect(tables.map((table) => table.name)).toContain('ai_creation_sessions')
  })
})
