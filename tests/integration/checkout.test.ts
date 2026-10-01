import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { sql } from 'drizzle-orm'
import { CheckoutSessionSchema } from '@server/validation/commerce'

let app: Hono
let root = ''
let ownerToken = ''
let ownerAccountId = ''
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

describe('plan catalog and checkout sessions', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-checkout-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { SchemaVersionManager } = await import('@server/services/versionService')
    expect(await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))).toBe(9)

    const apiRouter = (await import('@server/routes')).default
    app = new Hono()
    app.route('/api', apiRouter)

    const owner = await request('POST', '/api/auth/register', {
      email: 'checkout-owner@example.com',
      password: 'correct horse battery staple',
    })
    const other = await request('POST', '/api/auth/register', {
      email: 'checkout-other@example.com',
      password: 'another secure password',
    })
    ownerToken = owner.json.data.token as string
    ownerAccountId = owner.json.data.user.id as string
    otherToken = other.json.data.token as string
  }, 60000)

  afterAll(async () => {
    const { setPaymentProvider } = await import('@server/services/checkoutService')
    setPaymentProvider(null)
    delete process.env.DATABASE_URL
    await rm(root, { recursive: true, force: true })
  })

  it('serves a public catalog with explicit promotional and renewal pricing', async () => {
    const response = await request('GET', '/api/plans')

    expect(response.status).toBe(200)
    expect(response.json).toMatchObject({ success: true })
    expect(response.json.data.plans.map((plan: { name: string }) => plan.name)).toEqual([
      'Starter',
      'Business',
      'Pro',
    ])
    for (const plan of response.json.data.plans) {
      expect(plan.pricing.promotional.amountMinor).toBeTypeOf('number')
      expect(plan.pricing.renewal.amountMinor).toBeTypeOf('number')
      expect(plan.pricing.promotional.currency).toBe('USD')
      expect(plan.pricing.renewal.currency).toBe('USD')
    }
  })

  it('requires authentication and a project owned by the account', async () => {
    const project = await request('POST', '/api/projects', { name: 'Owner checkout project' }, ownerToken)
    expect(project.status).toBe(201)
    const projectId = project.json.data.id as string

    expect((await request('POST', '/api/checkout/sessions', {
      projectId,
      planId: 'plan_starter',
      termMonths: 12,
    })).status).toBe(401)

    const response = await request('POST', '/api/checkout/sessions', {
      projectId,
      planId: 'plan_starter',
      termMonths: 12,
    }, otherToken)
    expect(response.status).toBe(404)
    expect(response.json.error.code).toBe('NOT_FOUND')
  })

  it('snapshots the plan and term-specific totals in a draft checkout', async () => {
    const project = await request('POST', '/api/projects', { name: 'Snapshot checkout project' }, ownerToken)
    const response = await request('POST', '/api/checkout/sessions', {
      projectId: project.json.data.id,
      planId: 'plan_business',
      termMonths: 36,
    }, ownerToken)

    expect(response.status).toBe(201)
    const checkout = CheckoutSessionSchema.parse(response.json.data.checkout)
    expect(checkout).toMatchObject({
      accountId: ownerAccountId,
      projectId: project.json.data.id,
      planId: 'plan_business',
      termMonths: 36,
      status: 'draft',
      promotionalTotal: 2997,
      renewalTotal: 7497,
      currency: 'USD',
    })
    expect(checkout.planSnapshot.name).toBe('Business')
    expect(checkout.paymentReference).toBeUndefined()
  })

  it('rejects unsupported terms and unknown plans without creating a checkout', async () => {
    const project = await request('POST', '/api/projects', { name: 'Invalid checkout project' }, ownerToken)
    const projectId = project.json.data.id as string

    expect((await request('POST', '/api/checkout/sessions', {
      projectId,
      planId: 'plan_starter',
      termMonths: 24,
    }, ownerToken)).status).toBe(400)
    expect((await request('POST', '/api/checkout/sessions', {
      projectId,
      planId: 'plan_missing',
      termMonths: 12,
    }, ownerToken)).status).toBe(404)

    const { db } = await import('@server/db')
    const { checkoutSessions } = await import('@server/db/schema')
    const { eq } = await import('drizzle-orm')
    const rows = await db.select().from(checkoutSessions).where(eq(checkoutSessions.projectId, projectId)).all()
    expect(rows).toEqual([])
  })

  it('scopes checkout reads and confirmation to the owning account', async () => {
    const project = await request('POST', '/api/projects', { name: 'Private checkout project' }, ownerToken)
    const created = await request('POST', '/api/checkout/sessions', {
      projectId: project.json.data.id,
      planId: 'plan_starter',
      termMonths: 12,
    }, ownerToken)
    const id = created.json.data.checkout.id as string

    expect((await request('GET', `/api/checkout/sessions/${id}`, undefined, otherToken)).status).toBe(404)
    expect((await request('POST', `/api/checkout/sessions/${id}/confirm`, undefined, otherToken)).status).toBe(404)
  })

  it('does not confirm or create a subscription without a payment provider', async () => {
    const { setPaymentProvider } = await import('@server/services/checkoutService')
    setPaymentProvider(null)
    const project = await request('POST', '/api/projects', { name: 'Unpaid checkout project' }, ownerToken)
    const created = await request('POST', '/api/checkout/sessions', {
      projectId: project.json.data.id,
      planId: 'plan_pro',
      termMonths: 12,
    }, ownerToken)
    expect(created.status).toBe(201)
    const id = created.json.data.checkout.id as string

    const confirmed = await request('POST', `/api/checkout/sessions/${id}/confirm`, undefined, ownerToken)
    expect(confirmed.status).toBe(501)
    expect(confirmed.json.error.code).toBe('PAYMENT_PROVIDER_NOT_CONFIGURED')

    const fetched = await request('GET', `/api/checkout/sessions/${id}`, undefined, ownerToken)
    expect(fetched.json.data.checkout.status).toBe('draft')
    expect(fetched.json.data.checkout.paymentReference).toBeUndefined()

    const { db } = await import('@server/db')
    const tables = await db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`)
    expect(tables.map((table) => table.name)).not.toContain('subscriptions')
  })

  it('applies and rolls back migration 0007 checkout session storage', async () => {
    const { db } = await import('@server/db')
    const { SchemaVersionManager } = await import('@server/services/versionService')
    const tables = await db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`)
    expect(tables.map((table) => table.name)).toContain('checkout_sessions')

    expect(await SchemaVersionManager.rollback(resolve('src/server/db/migrations'), '0006')).toBe(3)
    const rolledBackTables = await db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`)
    expect(rolledBackTables.map((table) => table.name)).not.toContain('checkout_sessions')
  })
})
