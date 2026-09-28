import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { eq } from 'drizzle-orm'
import { deployments } from '@server/db/schema'

let app: Hono
let root = ''
let ownerToken = ''
let otherToken = ''

async function request(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  const response = await app.request(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, json: (await response.json()) as any }
}

describe('account-scoped deployment control plane', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-deployments-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { SchemaVersionManager } = await import('@server/services/versionService')
    expect(await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))).toBe(8)

    const authRouter = (await import('@server/routes/auth')).default
    const projectsRouter = (await import('@server/routes/projects')).default
    const deploymentsRouter = (await import('@server/routes/deployments')).default
    app = new Hono()
    app.route('/api/auth', authRouter)
    app.route('/api/projects', projectsRouter)
    app.route('/api/deployments', deploymentsRouter)

    const owner = await request('POST', '/api/auth/register', {
      email: 'deployment-owner@example.com',
      password: 'correct horse battery staple',
    })
    const other = await request('POST', '/api/auth/register', {
      email: 'deployment-other@example.com',
      password: 'correct horse battery staple',
    })
    ownerToken = owner.json.data.token as string
    otherToken = other.json.data.token as string
  }, 60000)

  afterAll(async () => {
    const { setDeploymentAdapter } = await import('@server/services/deploymentService')
    setDeploymentAdapter(null)
    delete process.env.DATABASE_URL
    await rm(root, { recursive: true, force: true })
  })

  it('creates queued deployments for an owned project and stores deterministic logs', async () => {
    const project = await request('POST', '/api/projects', {
      name: 'Deployment project',
      version: '2.4.0',
    }, ownerToken)
    expect(project.status).toBe(201)

    const created = await request('POST', '/api/deployments', {
      projectId: project.json.data.id,
      environment: 'staging',
      version: '2.4.1',
    }, ownerToken)
    expect(created.status).toBe(201)
    expect(created.json.data.deployment).toMatchObject({
      projectId: project.json.data.id,
      environment: 'staging',
      version: '2.4.1',
      status: 'queued',
      failure: null,
      previewUrl: null,
      liveUrl: null,
    })

    const id = created.json.data.deployment.id as string
    const listed = await request('GET', `/api/deployments?projectId=${project.json.data.id}`, undefined, ownerToken)
    expect(listed.status).toBe(200)
    expect(listed.json.data.deployments.map((item: { id: string }) => item.id)).toEqual([id])

    const logs = await request('GET', `/api/deployments/${id}/logs`, undefined, ownerToken)
    expect(logs.status).toBe(200)
    expect(logs.json.data.logs).toEqual([
      expect.objectContaining({ event: 'deployment.queued', message: 'Deployment queued' }),
    ])
  })

  it('moves queued to building without claiming a deployment and enforces transitions', async () => {
    const project = await request('POST', '/api/projects', { name: 'Build project' }, ownerToken)
    const created = await request('POST', '/api/deployments', {
      projectId: project.json.data.id,
      environment: 'preview',
    }, ownerToken)
    const id = created.json.data.deployment.id as string

    const built = await request('POST', `/api/deployments/${id}/build`, undefined, ownerToken)
    expect(built.status).toBe(200)
    expect(built.json.data.deployment.status).toBe('building')
    expect(built.json.data.deployment.startedAt).toBeTruthy()
    expect(built.json.data.deployment.liveUrl).toBeNull()

    const repeated = await request('POST', `/api/deployments/${id}/build`, undefined, ownerToken)
    expect(repeated.status).toBe(409)
    expect(repeated.json.error.code).toBe('INVALID_TRANSITION')

    const published = await request('POST', `/api/deployments/${id}/publish`, undefined, ownerToken)
    expect(published.status).toBe(409)
    expect(published.json.error.code).toBe('INVALID_TRANSITION')
  })

  it('requires an adapter for publishing and rollback without inventing URLs', async () => {
    const { db } = await import('@server/db')
    const { setDeploymentAdapter } = await import('@server/services/deploymentService')
    setDeploymentAdapter(null)
    const project = await request('POST', '/api/projects', { name: 'Adapter project' }, ownerToken)
    const created = await request('POST', '/api/deployments', {
      projectId: project.json.data.id,
      environment: 'production',
    }, ownerToken)
    const id = created.json.data.deployment.id as string
    await db.update(deployments).set({ status: 'ready' }).where(eq(deployments.id, id))

    const publish = await request('POST', `/api/deployments/${id}/publish`, undefined, ownerToken)
    expect(publish.status).toBe(501)
    expect(publish.json.error.code).toBe('DEPLOY_ADAPTER_NOT_CONFIGURED')
    expect(publish.json.data).toBeUndefined()

    const rollback = await request('POST', `/api/deployments/${id}/rollback`, undefined, ownerToken)
    expect(rollback.status).toBe(501)
    expect(rollback.json.error.code).toBe('DEPLOY_ADAPTER_NOT_CONFIGURED')
    expect(rollback.json.data).toBeUndefined()

    const fetched = await request('GET', `/api/deployments/${id}`, undefined, ownerToken)
    expect(fetched.json.data.deployment.status).toBe('ready')
    expect(fetched.json.data.deployment.liveUrl).toBeNull()
  })

  it('isolates deployments, logs, and actions between accounts', async () => {
    const project = await request('POST', '/api/projects', { name: 'Private deployment project' }, ownerToken)
    const created = await request('POST', '/api/deployments', {
      projectId: project.json.data.id,
      environment: 'preview',
    }, ownerToken)
    const id = created.json.data.deployment.id as string

    expect((await request('GET', `/api/deployments?projectId=${project.json.data.id}`, undefined, otherToken)).status).toBe(404)
    expect((await request('GET', `/api/deployments/${id}`, undefined, otherToken)).status).toBe(404)
    expect((await request('GET', `/api/deployments/${id}/logs`, undefined, otherToken)).status).toBe(404)
    expect((await request('POST', `/api/deployments/${id}/build`, undefined, otherToken)).status).toBe(404)
    expect((await request('POST', `/api/deployments/${id}/publish`, undefined, otherToken)).status).toBe(404)
    expect((await request('POST', `/api/deployments/${id}/rollback`, undefined, otherToken)).status).toBe(404)
  })

  it('applies migration 0006 with deployment tables', async () => {
    const { db } = await import('@server/db')
    const { sql } = await import('drizzle-orm')
    const tables = await db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`)
    expect(tables.map((table) => table.name)).toEqual(expect.arrayContaining(['deployments', 'deployment_logs']))
  })
})
