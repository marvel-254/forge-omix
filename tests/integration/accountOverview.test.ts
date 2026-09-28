import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

let app: Hono
let root = ''
let ownerToken = ''
let ownerAccountId = ''
let otherAccountId = ''
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

describe('account overview', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-account-overview-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { SchemaVersionManager } = await import('@server/services/versionService')
    expect(await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))).toBe(8)

    const apiRouter = (await import('@server/routes')).default
    app = new Hono()
    app.route('/api', apiRouter)

    const owner = await request('POST', '/api/auth/register', {
      email: 'overview-owner@example.com',
      password: 'correct horse battery staple',
      displayName: 'Overview Owner',
    })
    const other = await request('POST', '/api/auth/register', {
      email: 'overview-other@example.com',
      password: 'another secure password',
    })
    ownerToken = owner.json.data.token as string
    ownerAccountId = owner.json.data.user.id as string
    otherAccountId = other.json.data.user.id as string
    otherToken = other.json.data.token as string
  }, 60000)

  afterAll(async () => {
    delete process.env.DATABASE_URL
    await rm(root, { recursive: true, force: true })
  })

  it('requires authentication and returns an empty overview in the standard envelope', async () => {
    const unauthorized = await request('GET', '/api/account/overview')
    expect(unauthorized.status).toBe(401)
    expect(unauthorized.json).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    })
    expect(unauthorized.json.data).toBeUndefined()

    const response = await request('GET', '/api/account/overview', undefined, ownerToken)
    expect(response.status).toBe(200)
    expect(response.json).toEqual({
      success: true,
      data: {
        account: {
          id: ownerAccountId,
          email: 'overview-owner@example.com',
          displayName: 'Overview Owner',
          role: 'user',
        },
        projects: [],
        totals: { projects: 0, deployments: 0, domains: 0 },
      },
    })
  })

  it('returns owned projects newest first with per-project and account totals', async () => {
    const { db } = await import('@server/db')
    const { deployments, domains, projects } = await import('@server/db/schema')
    const olderDate = new Date('2025-01-01T00:00:00.000Z')
    const newerDate = new Date('2025-02-01T00:00:00.000Z')
    const olderId = crypto.randomUUID()
    const newerId = crypto.randomUUID()

    await db.insert(projects).values([
      {
        id: olderId,
        accountId: ownerAccountId,
        name: 'Older project',
        description: 'First project',
        version: '1.0.0',
        createdAt: olderDate,
        updatedAt: olderDate,
      },
      {
        id: newerId,
        accountId: ownerAccountId,
        name: 'Newer project',
        description: 'Second project',
        version: '1.0.0',
        createdAt: newerDate,
        updatedAt: newerDate,
      },
    ])
    await db.insert(deployments).values([
      {
        id: crypto.randomUUID(),
        accountId: ownerAccountId,
        projectId: olderId,
        environment: 'preview',
        status: 'queued',
        createdAt: olderDate,
        updatedAt: olderDate,
      },
      {
        id: crypto.randomUUID(),
        accountId: ownerAccountId,
        projectId: olderId,
        environment: 'production',
        status: 'queued',
        createdAt: olderDate,
        updatedAt: olderDate,
      },
      {
        id: crypto.randomUUID(),
        accountId: ownerAccountId,
        projectId: newerId,
        environment: 'preview',
        status: 'queued',
        createdAt: newerDate,
        updatedAt: newerDate,
      },
    ])
    await db.insert(domains).values([
      {
        id: crypto.randomUUID(),
        accountId: ownerAccountId,
        name: 'older.example',
        registration: {},
        hostingConnection: { projectId: olderId },
        createdAt: olderDate,
        updatedAt: olderDate,
      },
      {
        id: crypto.randomUUID(),
        accountId: ownerAccountId,
        name: 'newer.example',
        registration: {},
        hostingConnection: { projectId: newerId },
        createdAt: newerDate,
        updatedAt: newerDate,
      },
      {
        id: crypto.randomUUID(),
        accountId: ownerAccountId,
        name: 'unlinked.example',
        registration: {},
        createdAt: newerDate,
        updatedAt: newerDate,
      },
    ])

    const response = await request('GET', '/api/account/overview', undefined, ownerToken)
    expect(response.status).toBe(200)
    expect(response.json.data.projects).toEqual([
      {
        id: newerId,
        name: 'Newer project',
        description: 'Second project',
        updatedAt: newerDate.toISOString(),
        deploymentCount: 1,
        domainCount: 1,
      },
      {
        id: olderId,
        name: 'Older project',
        description: 'First project',
        updatedAt: olderDate.toISOString(),
        deploymentCount: 2,
        domainCount: 1,
      },
    ])
    expect(response.json.data.totals).toEqual({ projects: 2, deployments: 3, domains: 3 })
  })

  it('does not expose another account projects, deployments, or domains', async () => {
    const { db } = await import('@server/db')
    const { deployments, domains, projects } = await import('@server/db/schema')
    const otherDate = new Date('2025-03-01T00:00:00.000Z')
    const otherProjectId = crypto.randomUUID()

    await db.insert(projects).values({
      id: otherProjectId,
      accountId: otherAccountId,
      name: 'Other project',
      version: '1.0.0',
      createdAt: otherDate,
      updatedAt: otherDate,
    })
    await db.insert(deployments).values({
      id: crypto.randomUUID(),
      accountId: otherAccountId,
      projectId: otherProjectId,
      environment: 'preview',
      status: 'queued',
      createdAt: otherDate,
      updatedAt: otherDate,
    })
    await db.insert(domains).values({
      id: crypto.randomUUID(),
      accountId: otherAccountId,
      name: 'other.example',
      registration: {},
      createdAt: otherDate,
      updatedAt: otherDate,
    })

    const response = await request('GET', '/api/account/overview', undefined, otherToken)
    expect(response.status).toBe(200)
    expect(response.json.data.account.email).toBe('overview-other@example.com')
    expect(response.json.data.projects).toEqual([
      expect.objectContaining({
        id: otherProjectId,
        deploymentCount: 1,
        domainCount: 0,
      }),
    ])
    expect(response.json.data.totals).toEqual({ projects: 1, deployments: 1, domains: 1 })

    const ownerResponse = await request('GET', '/api/account/overview', undefined, ownerToken)
    expect(ownerResponse.json.data.projects).toHaveLength(2)
    expect(ownerResponse.json.data.projects.map((project: { id: string }) => project.id)).not.toContain(otherProjectId)
    expect(ownerResponse.json.data.totals).toEqual({ projects: 2, deployments: 3, domains: 3 })
  })
})
