import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Hono } from 'hono'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

let app: Hono
let root = ''
let wsPath = ''
let token = ''

async function post(path: string, body: unknown, authToken = token) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (authToken) headers.authorization = `Bearer ${authToken}`
  const res = await app.request(path, {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  return { status: res.status, json: (await res.json()) as any }
}

describe('git routes', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-git-routes-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    process.env.GIT_WORKSPACES = root
    const { SchemaVersionManager } = await import('@server/services/versionService')
    await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))
    const authRouter = (await import('@server/routes/auth')).default
    const gitRouter = (await import('@server/routes/git')).default
    app = new Hono()
    app.route('/api/auth', authRouter)
    app.route('/api/git', gitRouter)
    const registered = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'git@example.com', password: 'correct horse battery staple' }),
    })
    const registeredJson = (await registered.json()) as any
    expect(registered.status).toBe(201)
    token = registeredJson.data.token as string
    const init = await post('/api/git/init', { dir: 'site' })
    expect(init.status).toBe(201)
    wsPath = init.json.data.path as string
  }, 60000)

  afterAll(async () => {
    delete process.env.DATABASE_URL
    delete process.env.GIT_WORKSPACES
    await rm(root, { recursive: true, force: true })
  })

  it('rejects unauthenticated requests', async () => {
    const response = await post('/api/git/status', { dir: 'site' }, '')
    expect(response.status).toBe(401)
    expect(response.json.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects invalid bodies with the envelope', async () => {
    const missing = await post('/api/git/status', {})
    expect(missing.status).toBe(400)
    expect(missing.json.success).toBe(false)
    expect(missing.json.error.code).toBe('VALIDATION_ERROR')

    const badJson = await post('/api/git/status', '{nope')
    expect(badJson.status).toBe(400)
    expect(badJson.json.error.code).toBe('INVALID_JSON')

    const emptyMsg = await post('/api/git/commit', { dir: 'site', message: '' })
    expect(emptyMsg.status).toBe(400)
  })

  it('returns 404 for non-repos', async () => {
    const res = await post('/api/git/status', { dir: 'nope' })
    expect(res.status).toBe(404)
    expect(res.json.error.code).toBe('NOT_A_REPO')
  })

  it('runs the workspace flow end to end', async () => {
    await writeFile(join(wsPath, 'index.html'), '<h1>hi</h1>\n')
    const dirty = await post('/api/git/status', { dir: 'site' })
    expect(dirty.status).toBe(200)
    expect(dirty.json.data.untracked).toContain('index.html')
    expect(dirty.json.data.clean).toBe(false)

    const commit = await post('/api/git/commit', { dir: 'site', message: 'feat: homepage' })
    expect(commit.status).toBe(201)
    expect(commit.json.data.commit).toMatch(/^[0-9a-f]+$/)

    const clean = await post('/api/git/status', { dir: 'site' })
    expect(clean.json.data.clean).toBe(true)

    const log = await post('/api/git/log', { dir: 'site' })
    expect(log.json.data[0].message).toBe('feat: homepage')

    await writeFile(join(wsPath, 'index.html'), '<h1>hello</h1>\n')
    const diff = await post('/api/git/diff', { dir: 'site', file: 'index.html' })
    expect(diff.status).toBe(200)
    expect(diff.json.data.diff).toContain('hello')

    const checkout = await post('/api/git/checkout', {
      dir: 'site',
      branch: 'feature/a',
      create: true,
    })
    expect(checkout.json.data.current).toBe('feature/a')
    const branches = await post('/api/git/branches', { dir: 'site' })
    expect(branches.json.data.all).toContain('feature/a')

    await post('/api/git/commit', { dir: 'site', message: 'feat: greeting' })
    const since = await post('/api/git/changed-since', {
      dir: 'site',
      ref: commit.json.data.commit,
    })
    expect(since.json.data.files).toContain('index.html')
  })
})
