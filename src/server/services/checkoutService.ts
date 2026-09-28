import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { checkoutSessions } from '../db/schema'
import type { CheckoutSession } from '../types/commerce'
import { CheckoutSessionSchema, type CheckoutSessionCreateInput } from '../validation/commerce'
import { findHostingPlan } from './planCatalog'
import { getOwnedProject } from './projectService'

export interface PaymentConfirmation {
  paymentReference: string
  subscriptionId: string
}

export interface PaymentProvider {
  confirmPayment(checkout: CheckoutSession): Promise<PaymentConfirmation>
}

export class CommerceError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'PLAN_NOT_FOUND' | 'INVALID_TRANSITION' | 'PAYMENT_PROVIDER_NOT_CONFIGURED' | 'PAYMENT_CONFIRMATION_FAILED',
    readonly status: 404 | 409 | 501 | 502
  ) {
    super(message)
    this.name = 'CommerceError'
  }
}

let paymentProvider: PaymentProvider | null = null

export function getPaymentProvider(): PaymentProvider | null {
  return paymentProvider
}

export function setPaymentProvider(provider: PaymentProvider | null): void {
  paymentProvider = provider
}

function mapCheckoutSession(row: typeof checkoutSessions.$inferSelect): CheckoutSession {
  return CheckoutSessionSchema.parse({
    id: row.id,
    accountId: row.accountId,
    projectId: row.projectId,
    planId: row.planId,
    planSnapshot: row.planSnapshot,
    termMonths: row.termMonths,
    status: row.status,
    promotionalTotal: row.promotionalTotal,
    renewalTotal: row.renewalTotal,
    currency: row.currency,
    ...(row.paymentReference ? { paymentReference: row.paymentReference } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })
}

export async function createCheckoutSession(
  accountId: string,
  input: CheckoutSessionCreateInput
): Promise<CheckoutSession> {
  const project = await getOwnedProject(input.projectId, accountId)
  if (!project) throw new CommerceError('Project not found', 'NOT_FOUND', 404)

  const plan = findHostingPlan(input.planId)
  if (!plan) throw new CommerceError('Hosting plan not found', 'PLAN_NOT_FOUND', 404)

  const termYears = input.termMonths / 12
  const now = new Date()
  const row = await db
    .insert(checkoutSessions)
    .values({
      id: `checkout_${crypto.randomUUID()}`,
      accountId,
      projectId: project.id,
      planId: plan.id,
      planSnapshot: plan,
      termMonths: input.termMonths,
      status: 'draft',
      promotionalTotal: plan.pricing.promotional.amountMinor * termYears,
      renewalTotal: plan.pricing.renewal.amountMinor * termYears,
      currency: plan.pricing.promotional.currency,
      paymentReference: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get()

  return mapCheckoutSession(row)
}

export async function getCheckoutSession(accountId: string, id: string): Promise<CheckoutSession | null> {
  const row = await db
    .select()
    .from(checkoutSessions)
    .where(and(eq(checkoutSessions.id, id), eq(checkoutSessions.accountId, accountId)))
    .get()
  return row ? mapCheckoutSession(row) : null
}

export async function confirmCheckoutSession(accountId: string, id: string): Promise<CheckoutSession> {
  const existing = await getCheckoutSession(accountId, id)
  if (!existing) throw new CommerceError('Checkout session not found', 'NOT_FOUND', 404)
  if (existing.status !== 'draft' && existing.status !== 'pending_payment') {
    throw new CommerceError('Checkout session cannot be confirmed from its current status', 'INVALID_TRANSITION', 409)
  }

  const provider = getPaymentProvider()
  if (!provider) {
    throw new CommerceError('Payment provider is not configured', 'PAYMENT_PROVIDER_NOT_CONFIGURED', 501)
  }

  let confirmation: PaymentConfirmation
  try {
    confirmation = await provider.confirmPayment(existing)
  } catch {
    throw new CommerceError('Payment confirmation failed', 'PAYMENT_CONFIRMATION_FAILED', 502)
  }

  const row = await db
    .update(checkoutSessions)
    .set({
      status: 'completed',
      paymentReference: confirmation.paymentReference,
      updatedAt: new Date(),
    })
    .where(and(eq(checkoutSessions.id, id), eq(checkoutSessions.accountId, accountId)))
    .returning()
    .get()
  if (!row) throw new CommerceError('Checkout session not found', 'NOT_FOUND', 404)
  return mapCheckoutSession(row)
}
