import { describe, expect, it } from 'vitest'
import type { HostingPlan } from '@server/types/commerce'
import {
  CheckoutSessionSchema,
  DomainSchema,
  DeploymentSchema,
  HostingPlanSchema,
  InvoiceSchema,
  SubscriptionSchema,
} from '@server/validation'

const dates = {
  start: '2026-01-01T00:00:00Z',
  end: '2027-01-01T00:00:00Z',
  now: '2026-01-15T00:00:00Z',
}

const pricing = {
  promotional: { amountMinor: 399, currency: 'USD' },
  renewal: { amountMinor: 999, currency: 'USD' },
  termMonths: 12,
  billingInterval: 'month' as const,
  upfront: true as const,
}

const plan: HostingPlan = {
  id: 'plan_starter',
  slug: 'starter',
  name: 'Starter',
  audience: 'Small sites',
  description: 'A simple managed hosting plan.',
  limits: { websites: 10, storageGb: 10, monthlyVisits: 40000 },
  features: ['SSL', 'Custom domain'],
  pricing,
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_customer_1',
    accountId: 'acct_customer_1',
    planId: plan.id,
    status: 'active',
    pricing,
    autoRenew: true,
    cancelAtPeriodEnd: false,
    currentPeriodStart: dates.start,
    currentPeriodEnd: dates.end,
    createdAt: dates.now,
    updatedAt: dates.now,
    ...overrides,
  }
}

function invoice() {
  return {
    id: 'inv_2026_001',
    accountId: 'acct_customer_1',
    subscriptionId: 'sub_customer_1',
    number: 'INV-2026-001',
    status: 'open',
    lineItems: [
      {
        id: 'line_hosting_1',
        description: 'Starter hosting renewal',
        chargeType: 'recurring',
        productType: 'hosting_plan',
        productId: plan.id,
        quantity: 1,
        unitAmount: pricing.renewal,
        total: pricing.renewal,
      },
      {
        id: 'line_setup_1',
        description: 'One-time setup',
        chargeType: 'one_time',
        productType: 'addon',
        productId: 'addon_setup',
        quantity: 1,
        unitAmount: { amountMinor: 1500, currency: 'USD' },
        total: { amountMinor: 1500, currency: 'USD' },
      },
      {
        id: 'line_tax_1',
        description: 'Tax',
        chargeType: 'tax',
        productType: 'addon',
        productId: 'tax_vat',
        quantity: 1,
        unitAmount: { amountMinor: 0, currency: 'USD' },
        total: { amountMinor: 0, currency: 'USD' },
      },
    ],
    subtotal: { amountMinor: 11499, currency: 'USD' },
    tax: { amountMinor: 0, currency: 'USD' },
    total: { amountMinor: 11499, currency: 'USD' },
    periodStart: dates.start,
    periodEnd: dates.end,
    createdAt: dates.now,
  }
}

function domain(overrides: Record<string, unknown> = {}) {
  return {
    id: 'domain_example',
    accountId: 'acct_customer_1',
    name: 'Example.com',
    status: 'registered',
    registration: {
      ownership: 'owned',
      status: 'registered',
      autoRenew: true,
      registeredAt: dates.start,
      expiresAt: dates.end,
    },
    createdAt: dates.now,
    updatedAt: dates.now,
    ...overrides,
  }
}

function deployment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dep_release_1',
    accountId: 'acct_customer_1',
    projectId: 'proj_storefront',
    environment: 'production',
    status: 'queued',
    version: 'v1.0.0',
    domainIds: ['domain_example'],
    queuedAt: dates.now,
    createdAt: dates.now,
    updatedAt: dates.now,
    ...overrides,
  }
}

describe('Phase 16 commerce contracts', () => {
  it('keeps promotional and renewal pricing explicit for hosting plans', () => {
    const result = HostingPlanSchema.safeParse(plan)

    expect(result.success).toBe(true)
    expect(HostingPlanSchema.parse(plan).pricing).toMatchObject({
      promotional: { amountMinor: 399 },
      renewal: { amountMinor: 999 },
      termMonths: 12,
      upfront: true,
    })
  })

  it('rejects mismatched plan currencies and non-prepaid hosting pricing', () => {
    expect(HostingPlanSchema.safeParse({
      ...plan,
      pricing: { ...pricing, renewal: { amountMinor: 999, currency: 'EUR' } },
    }).success).toBe(false)
    expect(HostingPlanSchema.safeParse({
      ...plan,
      pricing: { ...pricing, upfront: false },
    }).success).toBe(false)
  })

  it('validates checkout snapshots, terms, totals, and payment references', () => {
    const checkout = {
      id: 'checkout_customer_1',
      accountId: 'acct_customer_1',
      projectId: 'proj_storefront',
      planId: plan.id,
      planSnapshot: plan,
      termMonths: 36,
      status: 'draft',
      promotionalTotal: 1197,
      renewalTotal: 2997,
      currency: 'USD',
      paymentReference: 'payment_123',
      createdAt: dates.now,
      updatedAt: dates.now,
    }

    expect(CheckoutSessionSchema.safeParse(checkout).success).toBe(true)
    expect(CheckoutSessionSchema.safeParse({ ...checkout, termMonths: 24 }).success).toBe(false)
    expect(CheckoutSessionSchema.safeParse({ ...checkout, promotionalTotal: 299 }).success).toBe(false)
    expect(CheckoutSessionSchema.safeParse({ ...checkout, currency: 'EUR' }).success).toBe(false)
  })

  it('represents trial, grace, auto-renewal, and period-end cancellation separately', () => {
    expect(SubscriptionSchema.safeParse(subscription({ status: 'trialing', trialEndsAt: dates.end })).success).toBe(true)
    expect(SubscriptionSchema.safeParse(subscription({
      status: 'grace',
      gracePeriodEndsAt: dates.end,
    })).success).toBe(true)
    expect(SubscriptionSchema.safeParse(subscription({
      status: 'active',
      autoRenew: false,
      cancelAtPeriodEnd: true,
      cancellationRequestedAt: dates.now,
    })).success).toBe(true)
    expect(SubscriptionSchema.safeParse(subscription({ status: 'grace' })).success).toBe(false)
  })

  it('labels recurring, one-time, and tax charges in invoices', () => {
    const result = InvoiceSchema.safeParse(invoice())

    expect(result.success).toBe(true)
    expect(InvoiceSchema.parse(invoice()).lineItems.map((line) => line.chargeType)).toEqual([
      'recurring',
      'one_time',
      'tax',
    ])
  })

  it('rejects mixed-currency invoice totals and invalid invoice periods', () => {
    expect(InvoiceSchema.safeParse({
      ...invoice(),
      total: { amountMinor: 11499, currency: 'EUR' },
    }).success).toBe(false)
    expect(InvoiceSchema.safeParse({
      ...invoice(),
      periodEnd: dates.start,
    }).success).toBe(false)
  })

  it('keeps domain registration ownership independent from hosting', () => {
    const result = DomainSchema.safeParse(domain({
      status: 'registered',
      registration: {
        ownership: 'external',
        status: 'registered',
        autoRenew: false,
        registeredAt: dates.start,
        expiresAt: dates.end,
      },
    }))

    expect(result.success).toBe(true)
    expect(DomainSchema.parse(domain({ name: 'Example.com' })).name).toBe('example.com')
  })

  it('requires an explicit hosting subscription when a domain is connected', () => {
    expect(DomainSchema.safeParse(domain({
      status: 'connected',
      hostingConnection: { status: 'connected' },
    })).success).toBe(false)
    expect(DomainSchema.safeParse(domain({
      status: 'connected',
      hostingConnection: {
        status: 'connected',
        hostingSubscriptionId: 'sub_customer_1',
        deploymentId: 'dep_release_1',
      },
    })).success).toBe(true)
  })

  it('accepts deployment lifecycle states and requires terminal-state details', () => {
    const nonTerminalStates = ['queued', 'building', 'deploying', 'rolled_back', 'deleted']
    expect(nonTerminalStates.every((state) => DeploymentSchema.safeParse(deployment({ status: state })).success)).toBe(true)
    expect(DeploymentSchema.safeParse(deployment({
      status: 'live',
      liveUrl: 'https://example.com',
    })).success).toBe(true)
    expect(DeploymentSchema.safeParse(deployment({ status: 'live' })).success).toBe(false)
    expect(DeploymentSchema.safeParse(deployment({
      status: 'failed',
      failure: { code: 'BUILD_FAILED', message: 'Build failed', retryable: true },
    })).success).toBe(true)
    expect(DeploymentSchema.safeParse(deployment({ status: 'failed' })).success).toBe(false)
    expect(DeploymentSchema.safeParse(deployment({ domainIds: ['domain_example', 'domain_example'] })).success).toBe(false)
  })
})
