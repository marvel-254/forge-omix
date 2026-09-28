import { z } from 'zod'

const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/)
const IsoDateTimeSchema = z.string().datetime({ offset: true })
const IdSchema = (prefix: string, minimumLength = 4) =>
  z.string().regex(new RegExp(`^${prefix}_[a-zA-Z0-9_-]{${minimumLength},}$`))

export const MoneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: CurrencyCodeSchema,
}).passthrough()

export const HostingPlanPricingSchema = z.object({
  promotional: MoneySchema,
  renewal: MoneySchema,
  termMonths: z.number().int().positive(),
  billingInterval: z.enum(['month', 'year']),
  upfront: z.literal(true),
}).passthrough().superRefine((pricing, context) => {
  if (pricing.promotional.currency !== pricing.renewal.currency) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['renewal', 'currency'],
      message: 'Promotional and renewal prices must use the same currency',
    })
  }
})

export const HostingPlanLimitsSchema = z.object({
  websites: z.number().int().positive(),
  storageGb: z.number().positive(),
  monthlyVisits: z.number().int().nonnegative(),
}).passthrough()

export const HostingPlanSchema = z.object({
  id: IdSchema('plan', 3),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1).max(100),
  audience: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  limits: HostingPlanLimitsSchema,
  features: z.array(z.string().min(1).max(200)),
  pricing: HostingPlanPricingSchema,
  trialPeriodDays: z.number().int().nonnegative().optional(),
  gracePeriodDays: z.number().int().nonnegative().optional(),
}).passthrough()

export const CheckoutTermMonthsSchema = z.union([z.literal(12), z.literal(36)])

export const CheckoutSessionStatusSchema = z.enum([
  'draft',
  'pending_payment',
  'completed',
  'cancelled',
])

export const checkoutSessionCreateSchema = z.object({
  projectId: z.string().trim().min(1).max(200),
  planId: z.string().trim().min(1).max(200),
  termMonths: CheckoutTermMonthsSchema,
}).strict()

export const CheckoutSessionSchema = z.object({
  id: z.string().min(1).max(200),
  accountId: z.string().min(1).max(200),
  projectId: z.string().min(1).max(200),
  planId: z.string().min(1).max(200),
  planSnapshot: HostingPlanSchema,
  termMonths: CheckoutTermMonthsSchema,
  status: CheckoutSessionStatusSchema,
  promotionalTotal: z.number().int().nonnegative(),
  renewalTotal: z.number().int().nonnegative(),
  currency: CurrencyCodeSchema,
  paymentReference: z.string().min(1).max(500).optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
}).passthrough().superRefine((checkout, context) => {
  if (checkout.planId !== checkout.planSnapshot.id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['planId'],
      message: 'Checkout plan ID must match the plan snapshot',
    })
  }
  if (checkout.currency !== checkout.planSnapshot.pricing.promotional.currency) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currency'],
      message: 'Checkout currency must match the plan snapshot',
    })
  }
  if (checkout.promotionalTotal !== checkout.planSnapshot.pricing.promotional.amountMinor * (checkout.termMonths / 12)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['promotionalTotal'],
      message: 'Checkout promotional total must match the plan and term',
    })
  }
  if (checkout.renewalTotal !== checkout.planSnapshot.pricing.renewal.amountMinor * (checkout.termMonths / 12)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['renewalTotal'],
      message: 'Checkout renewal total must match the plan and term',
    })
  }
})

export const SubscriptionSchema = z.object({
  id: IdSchema('sub'),
  accountId: IdSchema('acct'),
  planId: IdSchema('plan', 3),
  status: z.enum(['trialing', 'active', 'past_due', 'grace', 'cancelled', 'expired']),
  pricing: HostingPlanPricingSchema,
  autoRenew: z.boolean(),
  cancelAtPeriodEnd: z.boolean(),
  currentPeriodStart: IsoDateTimeSchema,
  currentPeriodEnd: IsoDateTimeSchema,
  trialEndsAt: IsoDateTimeSchema.optional(),
  gracePeriodEndsAt: IsoDateTimeSchema.optional(),
  cancellationRequestedAt: IsoDateTimeSchema.optional(),
  cancelledAt: IsoDateTimeSchema.optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
}).passthrough().superRefine((subscription, context) => {
  if (new Date(subscription.currentPeriodEnd) <= new Date(subscription.currentPeriodStart)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currentPeriodEnd'],
      message: 'Subscription period end must be after its start',
    })
  }
  if (subscription.status === 'grace' && !subscription.gracePeriodEndsAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['gracePeriodEndsAt'],
      message: 'A grace subscription must have a grace period end',
    })
  }
})

export const InvoiceStatusSchema = z.enum(['draft', 'open', 'paid', 'past_due', 'void', 'uncollectible'])
export const InvoiceChargeTypeSchema = z.enum(['recurring', 'one_time', 'tax'])
export const InvoiceProductTypeSchema = z.enum(['hosting_plan', 'domain', 'addon'])

export const InvoiceLineItemSchema = z.object({
  id: IdSchema('line'),
  description: z.string().min(1).max(500),
  chargeType: InvoiceChargeTypeSchema,
  productType: InvoiceProductTypeSchema,
  productId: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unitAmount: MoneySchema,
  total: MoneySchema,
}).passthrough()

export const InvoiceSchema = z.object({
  id: IdSchema('inv'),
  accountId: IdSchema('acct'),
  subscriptionId: IdSchema('sub').optional(),
  number: z.string().min(1).max(100),
  status: InvoiceStatusSchema,
  lineItems: z.array(InvoiceLineItemSchema).min(1),
  subtotal: MoneySchema,
  tax: MoneySchema,
  total: MoneySchema,
  periodStart: IsoDateTimeSchema,
  periodEnd: IsoDateTimeSchema,
  issuedAt: IsoDateTimeSchema.optional(),
  dueAt: IsoDateTimeSchema.optional(),
  paidAt: IsoDateTimeSchema.optional(),
  createdAt: IsoDateTimeSchema,
}).passthrough().superRefine((invoice, context) => {
  const currency = invoice.total.currency
  const amounts = [invoice.subtotal, invoice.tax, ...invoice.lineItems.flatMap((line) => [line.unitAmount, line.total])]
  if (amounts.some((amount) => amount.currency !== currency)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['total', 'currency'],
      message: 'All invoice amounts must use the invoice currency',
    })
  }
  if (new Date(invoice.periodEnd) <= new Date(invoice.periodStart)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['periodEnd'],
      message: 'Invoice period end must be after its start',
    })
  }
})

export const DomainNameSchema = z.string().trim().toLowerCase().regex(
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
)

export const DomainRegistrationSchema = z.object({
  ownership: z.enum(['owned', 'external', 'unknown']),
  status: z.enum(['not_registered', 'pending', 'registered', 'transferring', 'expired', 'cancelled']),
  autoRenew: z.boolean(),
  registeredAt: IsoDateTimeSchema.optional(),
  expiresAt: IsoDateTimeSchema.optional(),
}).passthrough()

export const DomainHostingConnectionSchema = z.object({
  status: z.enum(['disconnected', 'pending', 'connected', 'error']),
  projectId: z.string().trim().min(1).max(200).optional(),
  hostingSubscriptionId: IdSchema('sub').optional(),
  deploymentId: IdSchema('dep').optional(),
  verifiedAt: IsoDateTimeSchema.optional(),
}).passthrough()

export const DomainSchema = z.object({
  id: IdSchema('domain'),
  accountId: z.string().min(1).max(200),
  name: DomainNameSchema,
  status: z.enum(['searching', 'available', 'reserved', 'pending', 'registered', 'connected', 'renewal_due', 'expiring', 'expired']),
  registration: DomainRegistrationSchema,
  hostingConnection: DomainHostingConnectionSchema.optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
}).passthrough().superRefine((domain, context) => {
  if (domain.status === 'connected' && domain.hostingConnection?.status !== 'connected') {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hostingConnection', 'status'],
      message: 'A connected domain must have a connected hosting connection',
    })
  }
  if (domain.hostingConnection?.status === 'connected' && !domain.hostingConnection.hostingSubscriptionId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hostingConnection', 'hostingSubscriptionId'],
      message: 'A connected domain must identify its hosting subscription',
    })
  }
})

export const domainSearchQuerySchema = z.object({
  q: DomainNameSchema,
}).strict()

export const domainCreateSchema = z.object({
  name: DomainNameSchema,
  projectId: z.string().trim().min(1).max(200).optional(),
}).strict()

export const domainConnectSchema = z.object({
  projectId: z.string().trim().min(1).max(200),
}).strict()

export const DomainSearchResultSchema = z.object({
  name: DomainNameSchema,
  availability: z.literal('unknown'),
  verification: z.literal('not_checked'),
  source: z.literal('no_registrar'),
}).strict()

export type DomainSearchResultSchema = z.infer<typeof DomainSearchResultSchema>
export type DomainCreateInput = z.infer<typeof domainCreateSchema>
export type DomainConnectInput = z.infer<typeof domainConnectSchema>

export const DeploymentSchema = z.object({
  id: IdSchema('dep'),
  accountId: IdSchema('acct'),
  projectId: IdSchema('proj', 8),
  environment: z.enum(['preview', 'staging', 'production']),
  status: z.enum(['queued', 'building', 'deploying', 'live', 'failed', 'rolled_back', 'deleted']),
  version: z.string().min(1).max(100),
  domainIds: z.array(IdSchema('domain')).refine((ids) => new Set(ids).size === ids.length, 'Deployment domain IDs must be unique'),
  previewUrl: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  commitHash: z.string().min(1).max(100).optional(),
  failure: z.object({
    code: z.string().min(1).max(100),
    message: z.string().min(1).max(2000),
    retryable: z.boolean(),
  }).passthrough().optional(),
  queuedAt: IsoDateTimeSchema,
  startedAt: IsoDateTimeSchema.optional(),
  completedAt: IsoDateTimeSchema.optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
}).passthrough().superRefine((deployment, context) => {
  if (deployment.status === 'failed' && !deployment.failure) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['failure'],
      message: 'A failed deployment must include failure details',
    })
  }
  if (deployment.status === 'live' && !deployment.liveUrl) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['liveUrl'],
      message: 'A live deployment must include its live URL',
    })
  }
})

export type HostingPlanSchema = z.infer<typeof HostingPlanSchema>
export type CheckoutSessionCreateInput = z.infer<typeof checkoutSessionCreateSchema>
export type CheckoutSessionSchema = z.infer<typeof CheckoutSessionSchema>
export type SubscriptionSchema = z.infer<typeof SubscriptionSchema>
export type InvoiceSchema = z.infer<typeof InvoiceSchema>
export type DomainSchema = z.infer<typeof DomainSchema>
export type DeploymentSchema = z.infer<typeof DeploymentSchema>
