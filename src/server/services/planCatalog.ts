import type { HostingPlan } from '../types/commerce'

export const hostingPlans: readonly HostingPlan[] = [
  {
    id: 'plan_starter',
    slug: 'starter',
    name: 'Starter',
    audience: 'Small sites and first launches',
    description: 'Managed hosting for a focused personal or small-business site.',
    limits: {
      websites: 1,
      storageGb: 10,
      monthlyVisits: 25_000,
    },
    features: ['Managed SSL', 'Custom domain support', 'Daily backups'],
    pricing: {
      promotional: { amountMinor: 299, currency: 'USD' },
      renewal: { amountMinor: 999, currency: 'USD' },
      termMonths: 12,
      billingInterval: 'year',
      upfront: true,
    },
  },
  {
    id: 'plan_business',
    slug: 'business',
    name: 'Business',
    audience: 'Growing businesses',
    description: 'Higher limits for marketing sites and growing customer journeys.',
    limits: {
      websites: 3,
      storageGb: 50,
      monthlyVisits: 150_000,
    },
    features: ['Managed SSL', 'Custom domains', 'Daily backups', 'Priority support'],
    pricing: {
      promotional: { amountMinor: 999, currency: 'USD' },
      renewal: { amountMinor: 2499, currency: 'USD' },
      termMonths: 12,
      billingInterval: 'year',
      upfront: true,
    },
  },
  {
    id: 'plan_pro',
    slug: 'pro',
    name: 'Pro',
    audience: 'High-traffic products',
    description: 'Expanded capacity and support for established online products.',
    limits: {
      websites: 10,
      storageGb: 200,
      monthlyVisits: 1_000_000,
    },
    features: ['Managed SSL', 'Custom domains', 'Daily backups', 'Priority support', 'Traffic analytics'],
    pricing: {
      promotional: { amountMinor: 2499, currency: 'USD' },
      renewal: { amountMinor: 4999, currency: 'USD' },
      termMonths: 12,
      billingInterval: 'year',
      upfront: true,
    },
  },
]

export function listHostingPlans(): HostingPlan[] {
  return hostingPlans.map((plan) => ({
    ...plan,
    limits: { ...plan.limits },
    features: [...plan.features],
    pricing: {
      promotional: { ...plan.pricing.promotional },
      renewal: { ...plan.pricing.renewal },
      termMonths: plan.pricing.termMonths,
      billingInterval: plan.pricing.billingInterval,
      upfront: plan.pricing.upfront,
    },
  }))
}

export function findHostingPlan(planId: string): HostingPlan | undefined {
  const plan = hostingPlans.find((candidate) => candidate.id === planId)
  if (!plan) return undefined
  return {
    ...plan,
    limits: { ...plan.limits },
    features: [...plan.features],
    pricing: {
      promotional: { ...plan.pricing.promotional },
      renewal: { ...plan.pricing.renewal },
      termMonths: plan.pricing.termMonths,
      billingInterval: plan.pricing.billingInterval,
      upfront: plan.pricing.upfront,
    },
  }
}
