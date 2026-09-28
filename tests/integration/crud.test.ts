import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Hono } from 'hono'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

/**
 * Phase 12 route integration: CRUD routers + validated routes + auth,
 * against an isolated LibSQL file (dynamic imports after DATABASE_URL is
 * set, so the db singleton binds to the tmp file).
 */

let projectsRouter: any
let pagesRouter: any
let componentsRouter: any
let authRouter: any
let setupValidatedRoutes: any
let authToken = ''

async function request(
  app: Hono,
  method: string,
  path: string,
  body?: unknown,
  token: string | null = authToken
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  const res = await app.request(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: res.status, json: await res.json() }
}

describe('CRUD + auth + validated routes', () => {
  let app: Hono
  let root = ''

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-crud-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const db = await import('@server/db')
    const { SchemaVersionManager } = await import('@server/services/versionService')
    await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))
    void db
    projectsRouter = (await import('@server/routes/projects')).default
    pagesRouter = (await import('@server/routes/pages')).default
    componentsRouter = (await import('@server/routes/components')).default
    authRouter = (await import('@server/routes/auth')).default
    setupValidatedRoutes = (await import('@server/routes/validated')).setupValidatedRoutes

    app = new Hono()
    app.route('/api/projects', projectsRouter)
    app.route('/api/pages', pagesRouter)
    app.route('/api/components', componentsRouter)
    app.route('/api/auth', authRouter)
    setupValidatedRoutes(app as never)
    const registered = await request(app, 'POST', '/api/auth/register', {
      email: 'crud@example.com',
      password: 'correct horse battery staple',
    })
    expect(registered.status).toBe(201)
    authToken = registered.json.data.token as string
  }, 60000)

  afterAll(async () => {
    delete process.env.DATABASE_URL
    await rm(root, { recursive: true, force: true })
  })

  it('registers, logs in, and rejects bad credentials', async () => {
    const registered = await request(app, 'POST', '/api/auth/register', {
      email: 'registered@example.com',
      password: 'correct horse battery staple',
    })
    expect(registered.status).toBe(201)
    expect(registered.json.data.token).toBeTruthy()

    const ok = await request(app, 'POST', '/api/auth/login', {
      email: 'registered@example.com',
      password: 'correct horse battery staple',
    })
    expect(ok.status).toBe(200)
    expect(ok.json.data.token).toBeTruthy()

    const bad = await request(app, 'POST', '/api/auth/login', {
      email: 'registered@example.com',
      password: 'wrong-password',
    })
    expect(bad.status).toBe(401)

    const invalid = await request(app, 'POST', '/api/auth/login', {
      email: 'not-an-email',
      password: 'short',
    })
    expect(invalid.status).toBe(400)
    expect(invalid.json.error.code).toBe('VALIDATION_ERROR')
  })

  it('runs project row CRUD', async () => {
    const created = await request(app, 'POST', '/api/projects', { name: 'CRUD Project' })
    expect(created.status).toBe(201)
    const id = created.json.data.id as string
    expect(typeof id).toBe('string')

    const listed = await request(app, 'GET', '/api/projects', undefined)
    expect(listed.json.data.length).toBeGreaterThan(0)

    const fetched = await request(app, 'GET', `/api/projects/${id}`, undefined)
    expect(fetched.json.data.name).toBe('CRUD Project')

    const updated = await request(app, 'PUT', `/api/projects/${id}`, { name: 'Renamed' })
    expect(updated.json.data.name).toBe('Renamed')

    const missing = await request(app, 'GET', '/api/projects/does-not-exist', undefined)
    expect(missing.status).toBe(404)

    const deleted = await request(app, 'DELETE', `/api/projects/${id}`, undefined)
    expect(deleted.json.data.id).toBe(id)
  })

  it('rejects invalid project payloads', async () => {
    const res = await request(app, 'POST', '/api/projects', { description: 'no name' })
    expect(res.status).toBe(400)
    expect(res.json.error.code).toBe('VALIDATION_ERROR')
  })

  it('runs page row CRUD', async () => {
    const project = await request(app, 'POST', '/api/projects', { name: 'Page Owner' })
    const projectId = project.json.data.id as string

    const created = await request(app, 'POST', '/api/pages', {
      projectId,
      path: '/about',
      title: 'About',
    })
    expect(created.status).toBe(201)
    const pageId = created.json.data.id as string

    const fetched = await request(app, 'GET', `/api/pages/${pageId}`, undefined)
    expect(fetched.json.data.title).toBe('About')

    const badPath = await request(app, 'POST', '/api/pages', {
      projectId,
      path: 'no-slash',
      title: 'Bad',
    })
    expect(badPath.status).toBe(400)
  })

  it('runs component row CRUD', async () => {
    const project = await request(app, 'POST', '/api/projects', { name: 'Component Owner' })
    const projectId = project.json.data.id as string

    const created = await request(app, 'POST', '/api/components', {
      projectId,
      type: 'Button',
      name: 'CTA',
    })
    expect(created.status).toBe(201)
    const id = created.json.data.id as string

    const updated = await request(app, 'PUT', `/api/components/${id}`, {
      projectId,
      type: 'Button',
      name: 'CTA v2',
    })
    expect(updated.json.data.name).toBe('CTA v2')

    const deleted = await request(app, 'DELETE', `/api/components/${id}`, undefined)
    expect(deleted.json.data.id).toBe(id)
  })

  it('validates canonical flow payloads on the validated surface', async () => {
    const parent = await request(app, 'POST', '/api/projects', { name: 'Flow Owner' })
    const projectId = parent.json.data.id as string

    const created = await request(app, 'POST', `/api/projects/${projectId}/flows`, {
      id: 'flow_checkout',
      name: 'Checkout',
      steps: [{ id: 'step_start', name: 'Start' }],
      transitions: [],
    })
    expect(created.status).toBe(201)

    const bad = await request(app, 'POST', `/api/projects/${projectId}/flows`, {
      name: 'Missing id',
    })
    expect(bad.status).toBe(400)
  })
})
