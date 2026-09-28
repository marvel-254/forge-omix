import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlanSelector } from '@client/components/commerce/PlanSelector'
import { ApiError, commerceApi, type CheckoutSession, type HostingPlan } from '@client/lib/api'

vi.mock('@client/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@client/lib/api')>()
  return {
    ...actual,
    commerceApi: {
      plans: vi.fn(),
      createCheckoutSession: vi.fn(),
      getCheckoutSession: vi.fn(),
      confirmCheckoutSession: vi.fn(),
    },
  }
})

const plan: HostingPlan = {
  id: 'plan_starter',
  slug: 'starter',
  name: 'Starter',
  audience: 'Small sites',
  description: 'A simple managed hosting plan.',
  limits: { websites: 10, storageGb: 10, monthlyVisits: 40000 },
  features: ['SSL certificate', 'Custom domain'],
  pricing: {
    promotional: { amountMinor: 399, currency: 'USD' },
    renewal: { amountMinor: 999, currency: 'USD' },
    termMonths: 12,
    billingInterval: 'month',
    upfront: true,
  },
  trialPeriodDays: 14,
}

const checkout: CheckoutSession = {
  id: 'checkout_123',
  accountId: 'account_123',
  projectId: 'project_123',
  planId: plan.id,
  planSnapshot: plan,
  termMonths: 12,
  status: 'pending_payment',
  promotionalTotal: 399,
  renewalTotal: 999,
  currency: 'USD',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

function button(container: HTMLElement, text: string): HTMLButtonElement {
  const match = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.trim() === text)
  if (!match) throw new Error(`Button not found: ${text}`)
  return match
}

describe('PlanSelector', () => {
  let container: HTMLDivElement
  let root: Root

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterAll(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = false
  })

  beforeEach(() => {
    vi.clearAllMocks()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('renders accessible plan details with explicit promotional and renewal pricing', async () => {
    vi.mocked(commerceApi.plans).mockResolvedValue({ plans: [plan] })

    act(() => root.render(<PlanSelector projectId="project_123" onClose={() => {}} />))
    await flush()

    expect(container.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true')
    expect(container.querySelector('fieldset legend')?.textContent).toBe('Select a plan')
    expect(container.textContent).toContain('Starter')
    expect(container.textContent).toContain('Promotional price')
    expect(container.textContent).toContain('$3.99')
    expect(container.textContent).toContain('Renewal price')
    expect(container.textContent).toContain('$9.99')
    expect(container.textContent).toContain('10 websites')
    expect(container.textContent).toContain('10 GB storage')
    expect(container.textContent).toContain('40,000 visits/month')
    expect(container.textContent).toContain('SSL certificate · Custom domain')
  })

  it('passes the selected 12 or 36 month term when creating checkout', async () => {
    vi.mocked(commerceApi.plans).mockResolvedValue({ plans: [plan] })
    vi.mocked(commerceApi.createCheckoutSession).mockResolvedValue({ checkout })

    act(() => root.render(<PlanSelector projectId="project_123" onClose={() => {}} />))
    await flush()

    await act(async () => button(container, '36 months').click())
    await act(async () => button(container, 'Continue to payment').click())
    await flush()

    expect(commerceApi.createCheckoutSession).toHaveBeenCalledWith({
      projectId: 'project_123',
      planId: plan.id,
      termMonths: 36,
    })
    expect(container.textContent).toContain('Order summary')
    expect(container.textContent).toContain('$3.99')
  })

  it('surfaces the not-configured payment boundary without claiming completion', async () => {
    vi.mocked(commerceApi.plans).mockResolvedValue({ plans: [plan] })
    vi.mocked(commerceApi.createCheckoutSession).mockResolvedValue({ checkout })
    vi.mocked(commerceApi.confirmCheckoutSession).mockRejectedValue(
      new ApiError('Payment provider is not configured', 501, 'PAYMENT_PROVIDER_NOT_CONFIGURED')
    )

    act(() => root.render(<PlanSelector projectId="project_123" onClose={() => {}} />))
    await flush()
    await act(async () => button(container, 'Continue to payment').click())
    await flush()
    await act(async () => button(container, 'Confirm payment').click())
    await flush()

    expect(commerceApi.confirmCheckoutSession).toHaveBeenCalledWith(checkout.id)
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('PAYMENT_PROVIDER_NOT_CONFIGURED')
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('No subscription was created')
    expect(container.textContent).not.toContain('Checkout completed by the server')
  })

  it('only reports completion when the server returns completed', async () => {
    vi.mocked(commerceApi.plans).mockResolvedValue({ plans: [plan] })
    vi.mocked(commerceApi.createCheckoutSession).mockResolvedValue({ checkout })
    vi.mocked(commerceApi.confirmCheckoutSession).mockResolvedValue({
      checkout: { ...checkout, status: 'pending_payment' },
    })

    act(() => root.render(<PlanSelector projectId="project_123" onClose={() => {}} />))
    await flush()
    await act(async () => button(container, 'Continue to payment').click())
    await flush()
    await act(async () => button(container, 'Confirm payment').click())
    await flush()

    expect(container.querySelector('[role="status"]')?.textContent).toContain('pending payment')
    expect(container.textContent).not.toContain('Checkout completed by the server')
  })
})
