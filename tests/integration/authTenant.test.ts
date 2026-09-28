import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

let app: Hono
let root = ''

async function call(app: Hono, method: string, path: string, body?: unknown, token?: string, cookie?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  if (cookie) headers.cookie = cookie
  const response = await app.request(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, headers: response.headers, json: (await response.json()) as any }
}

describe('account sessions and project tenant isolation', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-auth-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { SchemaVersionManager } = await import('@server/services/versionService')
    await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))
    const authRouter = (await import('@server/routes/auth')).default
    const projectsRouter = (await import('@server/routes/projects')).default
    const pagesRouter = (await import('@server/routes/pages')).default
    const componentsRouter = (await import('@server/routes/components')).default
    const aiRouter = (await import('@server/routes/ai')).default
    const gitRouter = (await import('@server/routes/git')).default
    const feedbackRouter = (await import('@server/routes/feedback')).default
    const setupValidatedRoutes = (await import('@server/routes/validated')).setupValidatedRoutes
    app = new Hono()
    app.route('/api/auth', authRouter)
    app.route('/api/projects', projectsRouter)
    app.route('/api/pages', pagesRouter)
    app.route('/api/components', componentsRouter)
    app.route('/api/ai', aiRouter)
    app.route('/api/git', gitRouter)
    app.route('/api/feedback', feedbackRouter)
    setupValidatedRoutes(app as never)
  }, 60000)

  afterAll(async () => {
    delete process.env.DATABASE_URL
    await rm(root, { recursive: true, force: true })
  })

  it('registers, hashes credentials, creates sessions, and logs out', async () => {
    const registered = await call(app, 'POST', '/api/auth/register', {
      email: 'owner@example.com',
      password: 'correct horse battery staple',
      displayName: 'Owner',
    })
    expect(registered.status).toBe(201)
    expect(registered.json.data.token).toBeTruthy()
    expect(registered.json.data.user.email).toBe('owner@example.com')
    expect(registered.json.data.user.passwordHash).toBeUndefined()
    expect(registered.headers.get('set-cookie')).toContain('HttpOnly')

    const { db } = await import('@server/db')
    const { accounts } = await import('@server/db/schema')
    const account = await db.select().from(accounts).where((await import('drizzle-orm')).eq(accounts.email, 'owner@example.com')).get()
    expect(account?.passwordHash).toMatch(/^scrypt\$/)
    expect(account?.passwordHash).not.toContain('correct horse battery staple')

    const me = await call(app, 'GET', '/api/auth/me', undefined, registered.json.data.token)
    expect(me.status).toBe(200)
    expect(me.json.data.user.id).toBe(registered.json.data.user.id)

    const cookie = registered.headers.get('set-cookie')?.split(';')[0]
    expect(cookie).toBeTruthy()
    const cookieMe = await call(app, 'GET', '/api/auth/me', undefined, undefined, cookie)
    expect(cookieMe.status).toBe(200)
    expect(cookieMe.json.data.user.id).toBe(registered.json.data.user.id)

    const loggedOut = await call(app, 'POST', '/api/auth/logout', undefined, registered.json.data.token)
    expect(loggedOut.status).toBe(200)
    const afterLogout = await call(app, 'GET', '/api/auth/me', undefined, registered.json.data.token)
    expect(afterLogout.status).toBe(401)
  })

  it('does not allow accounts to read or mutate another account project', async () => {
    const owner = await call(app, 'POST', '/api/auth/login', {
      email: 'owner@example.com',
      password: 'correct horse battery staple',
    })
    const other = await call(app, 'POST', '/api/auth/register', {
      email: 'other@example.com',
      password: 'another secure password',
    })
    const ownerToken = owner.json.data.token as string
    const otherToken = other.json.data.token as string

    const created = await call(app, 'POST', '/api/projects', { name: 'Owner project' }, ownerToken)
    expect(created.status).toBe(201)
    const projectId = created.json.data.id as string

    expect((await call(app, 'GET', '/api/projects', undefined, otherToken)).json.data).toEqual([])
    expect((await call(app, 'GET', `/api/projects/${projectId}`, undefined, otherToken)).status).toBe(404)
    expect((await call(app, 'PUT', `/api/projects/${projectId}`, { name: 'stolen' }, otherToken)).status).toBe(404)
    expect((await call(app, 'DELETE', `/api/projects/${projectId}`, undefined, otherToken)).status).toBe(404)
    expect((await call(app, 'GET', `/api/projects/${projectId}/project`, undefined, ownerToken)).status).toBe(200)
  })

  it('rejects unauthenticated access to every protected route family', async () => {
    const requests = [
      call(app, 'GET', '/api/projects'),
      call(app, 'GET', '/api/pages/project/missing'),
      call(app, 'GET', '/api/components/missing'),
      call(app, 'GET', '/api/ai/models'),
      call(app, 'POST', '/api/git/status', { dir: 'site' }),
      call(app, 'POST', '/api/feedback', { kind: 'other', message: 'x' }),
      call(app, 'GET', '/api/templates'),
    ]
    for (const response of await Promise.all(requests)) {
      expect(response.status).toBe(401)
      expect(response.json.error.code).toBe('UNAUTHORIZED')
    }
  })
})
