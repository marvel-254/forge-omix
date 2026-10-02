import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import JSZip from 'jszip'

let app: Hono
let root = ''
let token = ''

async function register() {
  const res = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'builder@example.com', password: 'correct horse battery staple' }),
  })
  expect(res.status).toBe(201)
  return ((await res.json()) as any).data.token as string
}

describe('project build & export', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-build-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { SchemaVersionManager } = await import('@server/services/versionService')
    await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))
    const authRouter = (await import('@server/routes/auth')).default
    const projectsRouter = (await import('@server/routes/projects')).default
    app = new Hono()
    app.route('/api/auth', authRouter)
    app.route('/api/projects', projectsRouter)
    token = await register()
  }, 60000)

  afterAll(async () => {
    delete process.env.DATABASE_URL
    if (root) await rm(root, { recursive: true, force: true })
  })

  it('creates a project', async () => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Acme Landing',
        framework: 'react',
        version: '1.0.0',
        pages: [{ id: 'home', path: '/', title: 'Home', components: [] }],
      }),
    })
    expect(res.status).toBe(201)
    const data = (await res.json()) as any
    expect(data.data.pages).toHaveLength(1)
  })

  it('exports a deployable source archive (zip)', async () => {
    const created = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Demo Site',
        pages: [{ id: 'home', path: '/', title: 'Home', components: [] }],
      }),
    })
    expect(created.status).toBe(201)
    const id = ((await created.json()) as any).data.id as string

    const res = await app.request(`/api/projects/${id}/export`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.data.fileCount).toBeGreaterThan(0)
    expect(data.data.built).toBe(false)

    const zip = await JSZip.loadAsync(Buffer.from(data.data.base64, 'base64'))
    expect(zip.file('package.json')).not.toBeNull()
    expect(zip.file('src/App.tsx')).not.toBeNull()
    expect(zip.file('vercel.json')).not.toBeNull()
    expect(zip.file('netlify.toml')).not.toBeNull()
    expect(zip.file('.github/workflows/deploy-site.yml')).not.toBeNull()

    const pkg = await (zip.file('package.json') as any).async('string')
    expect(pkg).toContain('"vite"')
  })

  it('build endpoint returns metadata (inline build off by default)', async () => {
    const created = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Build Me', pages: [{ id: 'home', path: '/', title: 'Home', components: [] }] }),
    })
    const id = ((await created.json()) as any).data.id as string

    const res = await app.request(`/api/projects/${id}/build`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.data.fileCount).toBeGreaterThan(0)
    expect(typeof data.data.base64).toBe('string')
  })

  it('rejects export of a project owned by another account', async () => {
    const other = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'other@example.com', password: 'correct horse battery staple' }),
    })
    const otherToken = ((await other.json()) as any).data.token as string

    const created = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Mine', pages: [{ id: 'home', path: '/', title: 'Home', components: [] }] }),
    })
    const id = ((await created.json()) as any).data.id as string

    const res = await app.request(`/api/projects/${id}/export`, {
      method: 'POST',
      headers: { authorization: `Bearer ${otherToken}` },
    })
    expect(res.status).toBe(404)
  })
})
