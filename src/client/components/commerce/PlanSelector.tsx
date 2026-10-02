import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  ApiError,
  commerceApi,
  type CheckoutSession,
  type CheckoutTermMonths,
  type HostingPlan,
} from '@client/lib/api'
import { Button } from '../ui/Button'

interface PlanSelectorProps {
  projectId: string
  onClose: () => void
}

function formatMoney(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amountMinor / 100)
  } catch {
    return `${currency} ${(amountMinor / 100).toFixed(2)}`
  }
}

function paymentBoundaryMessage(error: unknown): string | null {
  if (error instanceof ApiError && error.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED') {
    return 'Payment is unavailable because no payment provider is configured (PAYMENT_PROVIDER_NOT_CONFIGURED). No subscription was created.'
  }
  return null
}

function checkoutStatusLabel(status: CheckoutSession['status']): string {
  return status === 'pending_payment' ? 'pending payment' : status
}

export function PlanSelector({ projectId, onClose }: PlanSelectorProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [plans, setPlans] = useState<HostingPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [termMonths, setTermMonths] = useState<CheckoutTermMonths>(12)
  const [checkout, setCheckout] = useState<CheckoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    void commerceApi
      .plans()
      .then((result) => {
        if (!active) return
        setPlans(result.plans)
        setSelectedPlanId((current) => current ?? result.plans[0]?.id ?? null)
      })
      .catch((caught) => {
        if (!active) return
        setError(caught instanceof ApiError ? caught.message : 'Could not load hosting plans')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const createCheckout = useCallback(async () => {
    if (!selectedPlan) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const result = await commerceApi.createCheckoutSession({
        projectId,
        planId: selectedPlan.id,
        termMonths,
      })
      setCheckout(result.checkout)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not create checkout session')
    } finally {
      setBusy(false)
    }
  }, [projectId, selectedPlan, termMonths])

  const confirmCheckout = useCallback(async () => {
    if (!checkout) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const result = await commerceApi.confirmCheckoutSession(checkout.id)
      setCheckout(result.checkout)
      setNotice(
        result.checkout.status === 'completed'
          ? 'Checkout completed by the server.'
          : `Payment response received, but the server reports ${checkoutStatusLabel(result.checkout.status)}. No payment or subscription success is being claimed.`
      )
    } catch (caught) {
      setError(paymentBoundaryMessage(caught) ?? (caught instanceof ApiError ? caught.message : 'Could not confirm checkout'))
    } finally {
      setBusy(false)
    }
  }, [checkout])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose()
            return
          }
          if (event.key !== 'Tab') return
          const focusable = Array.from(
            dialogRef.current?.querySelectorAll<HTMLElement>(
              'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            ) ?? []
          )
          if (focusable.length === 0) return
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={loading || busy}
      >
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              Hosting plans
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose hosting for project {projectId}.</p>
          </div>
          <Button
            ref={closeButtonRef}
            className="ml-auto"
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close plans"
          >
            ×
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && (
            <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {notice}
            </p>
          )}

          <fieldset>
            <legend className="text-sm font-semibold text-foreground">Select a plan</legend>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading plans…</p>
              ) : plans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hosting plans are available.</p>
              ) : (
                plans.map((plan) => {
                  const selected = plan.id === selectedPlanId
                  return (
                    <label
                      key={plan.id}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                        selected ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200' : 'border-border hover:bg-muted'
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="hosting-plan"
                          value={plan.id}
                          checked={selected}
                          onChange={() => {
                            setSelectedPlanId(plan.id)
                            setCheckout(null)
                            setNotice(null)
                            setError(null)
                          }}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-semibold text-foreground">{plan.name}</span>
                          <span className="block text-xs text-muted-foreground">{plan.audience}</span>
                        </span>
                      </span>
                      <span className="mt-3 block text-sm text-foreground/80">{plan.description}</span>
                      <span className="mt-3 block text-sm">
                        <span className="block text-muted-foreground">Promotional price</span>
                        <span className="text-lg font-semibold text-foreground">
                          {formatMoney(plan.pricing.promotional.amountMinor, plan.pricing.promotional.currency)}
                        </span>
                      </span>
                      <span className="mt-2 block text-sm">
                        <span className="block text-muted-foreground">Renewal price</span>
                        <span className="font-medium text-neutral-800">
                          {formatMoney(plan.pricing.renewal.amountMinor, plan.pricing.renewal.currency)}
                        </span>
                      </span>
                      <span className="mt-3 block text-xs text-muted-foreground">
                        {plan.limits.websites} websites · {plan.limits.storageGb} GB storage ·{' '}
                        {plan.limits.monthlyVisits.toLocaleString()} visits/month
                      </span>
                      <span className="mt-2 block text-xs text-muted-foreground">{plan.features.join(' · ')}</span>
                      {plan.trialPeriodDays && <span className="mt-2 block text-xs text-emerald-700">{plan.trialPeriodDays}-day trial</span>}
                      {plan.gracePeriodDays && <span className="mt-1 block text-xs text-muted-foreground">{plan.gracePeriodDays}-day grace period</span>}
                    </label>
                  )
                })
              )}
            </div>
          </fieldset>

          <fieldset className="mt-5 rounded-lg border bg-muted p-4">
            <legend className="px-1 text-sm font-semibold text-foreground">Payment term</legend>
            <div className="mt-2 flex gap-2" role="group" aria-label="Payment term">
              {([12, 36] as const).map((term) => (
                <Button
                  key={term}
                  type="button"
                  size="sm"
                  variant={termMonths === term ? 'default' : 'outline'}
                  aria-pressed={termMonths === term}
                  onClick={() => {
                    setTermMonths(term)
                    setCheckout(null)
                    setNotice(null)
                    setError(null)
                  }}
                >
                  {term} months
                </Button>
              ))}
            </div>
          </fieldset>

          {selectedPlan && !checkout && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">Selected: {selectedPlan.name} · {termMonths} months</p>
              <Button onClick={() => void createCheckout()} disabled={busy || loading}>
                {busy ? 'Creating…' : 'Continue to payment'}
              </Button>
            </div>
          )}

          {checkout && (
            <section aria-labelledby="order-summary-heading" className="mt-5 rounded-lg border border-primary-200 bg-primary-50 p-4">
              <h3 id="order-summary-heading" className="text-sm font-semibold text-foreground">Order summary</h3>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd className="font-medium text-foreground">{checkout.planSnapshot.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Term</dt>
                  <dd className="font-medium text-foreground">{checkout.termMonths} months</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Promotional total</dt>
                  <dd className="font-medium text-foreground">{formatMoney(checkout.promotionalTotal, checkout.currency)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Renewal total</dt>
                  <dd className="font-medium text-foreground">{formatMoney(checkout.renewalTotal, checkout.currency)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium text-foreground">{checkoutStatusLabel(checkout.status)}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setCheckout(null)} disabled={busy}>Change plan</Button>
                <Button onClick={() => void confirmCheckout()} disabled={busy || checkout.status === 'completed'}>
                  {busy ? 'Confirming…' : 'Confirm payment'}
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
