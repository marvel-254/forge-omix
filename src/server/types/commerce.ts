export type CurrencyCode = string

export interface Money {
  amountMinor: number
  currency: CurrencyCode
}

export type BillingInterval = 'month' | 'year'

export interface HostingPlanPricing {
  promotional: Money
  renewal: Money
  termMonths: number
  billingInterval: BillingInterval
  upfront: true
}

export interface HostingPlanLimits {
  websites: number
  storageGb: number
  monthlyVisits: number
}

export interface HostingPlan {
  id: string
  slug: string
  name: string
  audience: string
  description: string
  limits: HostingPlanLimits
  features: string[]
  pricing: HostingPlanPricing
  trialPeriodDays?: number
  gracePeriodDays?: number
}

export type CheckoutTermMonths = 12 | 36

export type CheckoutSessionStatus = 'draft' | 'pending_payment' | 'completed' | 'cancelled'

export interface CheckoutSession {
  id: string
  accountId: string
  projectId: string
  planId: string
  planSnapshot: HostingPlan
  termMonths: CheckoutTermMonths
  status: CheckoutSessionStatus
  promotionalTotal: number
  renewalTotal: number
  currency: CurrencyCode
  paymentReference?: string
  createdAt: string
  updatedAt: string
}

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'grace' | 'cancelled' | 'expired'

export interface Subscription {
  id: string
  accountId: string
  planId: string
  status: SubscriptionStatus
  pricing: HostingPlanPricing
  autoRenew: boolean
  cancelAtPeriodEnd: boolean
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEndsAt?: string
  gracePeriodEndsAt?: string
  cancellationRequestedAt?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'past_due' | 'void' | 'uncollectible'

export type InvoiceChargeType = 'recurring' | 'one_time' | 'tax'

export type InvoiceProductType = 'hosting_plan' | 'domain' | 'addon'

export interface InvoiceLineItem {
  id: string
  description: string
  chargeType: InvoiceChargeType
  productType: InvoiceProductType
  productId: string
  quantity: number
  unitAmount: Money
  total: Money
}

export interface Invoice {
  id: string
  accountId: string
  subscriptionId?: string
  number: string
  status: InvoiceStatus
  lineItems: InvoiceLineItem[]
  subtotal: Money
  tax: Money
  total: Money
  periodStart: string
  periodEnd: string
  issuedAt?: string
  dueAt?: string
  paidAt?: string
  createdAt: string
}

export type DomainStatus = 'searching' | 'available' | 'reserved' | 'pending' | 'registered' | 'connected' | 'renewal_due' | 'expiring' | 'expired'

export type DomainOwnership = 'owned' | 'external' | 'unknown'

export type DomainRegistrationStatus = 'not_registered' | 'pending' | 'registered' | 'transferring' | 'expired' | 'cancelled'

export type DomainConnectionStatus = 'disconnected' | 'pending' | 'connected' | 'error'

export interface DomainRegistration {
  ownership: DomainOwnership
  status: DomainRegistrationStatus
  autoRenew: boolean
  registeredAt?: string
  expiresAt?: string
}

export interface DomainHostingConnection {
  status: DomainConnectionStatus
  projectId?: string
  hostingSubscriptionId?: string
  deploymentId?: string
  verifiedAt?: string
}

export interface Domain {
  id: string
  accountId: string
  name: string
  status: DomainStatus
  registration: DomainRegistration
  hostingConnection?: DomainHostingConnection
  createdAt: string
  updatedAt: string
}

export interface DomainSearchResult {
  name: string
  availability: 'unknown'
  verification: 'not_checked'
  source: 'no_registrar'
}

export type DeploymentEnvironment = 'preview' | 'staging' | 'production'

export type DeploymentStatus = 'queued' | 'building' | 'deploying' | 'live' | 'failed' | 'rolled_back' | 'deleted'

export interface DeploymentFailure {
  code: string
  message: string
  retryable: boolean
}

export interface Deployment {
  id: string
  accountId: string
  projectId: string
  environment: DeploymentEnvironment
  status: DeploymentStatus
  version: string
  domainIds: string[]
  previewUrl?: string
  liveUrl?: string
  commitHash?: string
  failure?: DeploymentFailure
  queuedAt: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}
