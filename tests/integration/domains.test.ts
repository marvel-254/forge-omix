import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { sql } from 'drizzle-orm'

let app: Hono
let root = ''
let ownerToken = ''
let otherToken = ''
let ownerAccountId = ''

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

describe('account-scoped domain lifecycle', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-domains-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { SchemaVersionManager } = await import('@server/services/versionService')
    expect(await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))).toBe(10)

    const authRouter = (await import('@server/routes/auth')).default
    const projectsRouter = (await import('@server/routes/projects')).default
    const domainsRouter = (await import('@server/routes/domains')).default
    app = new Hono()
    app.route('/api/auth', authRouter)
    app.route('/api/projects', projectsRouter)
    app.route('/api/domains', domainsRouter)

    const owner = await request('POST', '/api/auth/register', {
      email: 'domain-owner@example.com',
      password: 'correct horse battery staple',
    })
    const other = await request('POST', '/api/auth/register', {
      email: 'domain-other@example.com',
      password: 'another secure password',
    })
    ownerToken = owner.json.data.token as string
    ownerAccountId = owner.json.data.user.id as string
    otherToken = other.json.data.token as string
  }, 60000)

  afterAll(async () => {
    const { setDomainRegistrarProvider } = await import('@server/services/domainService')
    setDomainRegistrarProvider(null)
    delete process.env.DATABASE_URL
    await rm(root, { recursive: true, force: true })
  })

  it('serves public normalized search results without claiming registrar availability', async () => {
    const response = await request('GET', '/api/domains/search?q=%20Example.COM%20')

    expect(response.status).toBe(200)
    expect(response.json).toEqual({
      success: true,
      data: {
        results: [{
          name: 'example.com',
          availability: 'unknown',
          verification: 'not_checked',
          source: 'no_registrar',
        }],
      },
    })
    expect((await request('GET', '/api/domains/search?q=not%20a%20domain')).status).toBe(400)
  })

  it('requires authentication and stores account-owned desired domains', async () => {
    expect((await request('GET', '/api/domains')).status).toBe(401)
    expect((await request('POST', '/api/domains', { name: 'unauthorized.test' })).status).toBe(401)

    const created = await request('POST', '/api/domains', { name: '  Account-Scoped.COM  ' }, ownerToken)
    expect(created.status).toBe(201)
    expect(created.json.data.domain).toMatchObject({
      accountId: ownerAccountId,
      name: 'account-scoped.com',
      status: 'available',
      registration: {
        ownership: 'unknown',
        status: 'not_registered',
        autoRenew: false,
      },
    })
    expect(created.json.data.domain.hostingConnection).toBeUndefined()

    const listed = await request('GET', '/api/domains', undefined, ownerToken)
    expect(listed.json.data.domains.map((domain: { name: string }) => domain.name)).toContain('account-scoped.com')
    expect((await request('GET', '/api/domains', undefined, otherToken)).json.data.domains).toEqual([])
  })

  it('normalizes connected domains, requires an owned project, and disconnects cleanly', async () => {
    const project = await request('POST', '/api/projects', { name: 'Domain project' }, ownerToken)
    expect(project.status).toBe(201)

    const created = await request('POST', '/api/domains', {
      name: 'Connected.NET',
      projectId: project.json.data.id,
    }, ownerToken)
    expect(created.status).toBe(201)
    expect(created.json.data.domain).toMatchObject({
      name: 'connected.net',
      status: 'pending',
      registration: { ownership: 'unknown', status: 'not_registered' },
      hostingConnection: {
        status: 'pending',
        projectId: project.json.data.id,
      },
    })
    expect(created.json.data.domain.hostingConnection.verifiedAt).toBeUndefined()
    const id = created.json.data.domain.id as string

    const unavailableProject = await request('POST', '/api/domains', {
      name: 'foreign-project.net',
      projectId: 'missing-project',
    }, otherToken)
    expect(unavailableProject.status).toBe(404)
    expect(unavailableProject.json.error.code).toBe('NOT_FOUND')

    const disconnected = await request('POST', `/api/domains/${id}/disconnect`, undefined, ownerToken)
    expect(disconnected.status).toBe(200)
    expect(disconnected.json.data.domain).toMatchObject({
      name: 'connected.net',
      status: 'available',
      registration: { ownership: 'unknown', status: 'not_registered' },
    })
    expect(disconnected.json.data.domain.hostingConnection).toBeUndefined()
  })

  it('isolates domain reads and mutations between accounts', async () => {
    const ownerProject = await request('POST', '/api/projects', { name: 'Owner private project' }, ownerToken)
    const otherProject = await request('POST', '/api/projects', { name: 'Other private project' }, otherToken)
    const created = await request('POST', '/api/domains', { name: 'private-domain.test' }, ownerToken)
    const id = created.json.data.domain.id as string

    expect((await request('POST', `/api/domains/${id}/connect`, {
      projectId: otherProject.json.data.id,
    }, ownerToken)).status).toBe(404)
    expect((await request('POST', `/api/domains/${id}/connect`, {
      projectId: ownerProject.json.data.id,
    }, otherToken)).status).toBe(404)
    expect((await request('POST', `/api/domains/${id}/disconnect`, undefined, otherToken)).status).toBe(404)

    const unchanged = await request('GET', '/api/domains', undefined, ownerToken)
    const domain = unchanged.json.data.domains.find((item: { id: string }) => item.id === id)
    expect(domain).toMatchObject({ status: 'available', name: 'private-domain.test' })
    expect(domain.hostingConnection).toBeUndefined()
  })

  it('does not register without an explicit registrar provider', async () => {
    const { setDomainRegistrarProvider } = await import('@server/services/domainService')
    setDomainRegistrarProvider(null)
    const created = await request('POST', '/api/domains', { name: 'register-me.test' }, ownerToken)
    const id = created.json.data.domain.id as string

    const response = await request('POST', `/api/domains/${id}/register`, undefined, ownerToken)
    expect(response.status).toBe(501)
    expect(response.json.error.code).toBe('DOMAIN_REGISTRAR_NOT_CONFIGURED')

    const listed = await request('GET', '/api/domains', undefined, ownerToken)
    const domain = listed.json.data.domains.find((item: { id: string }) => item.id === id)
    expect(domain).toMatchObject({
      status: 'available',
      registration: { ownership: 'unknown', status: 'not_registered' },
    })
  })

  it('applies migration 0008 with the domain table', async () => {
    const { db } = await import('@server/db')
    const tables = await db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`)
    expect(tables.map((table) => table.name)).toContain('domains')
  })
})
