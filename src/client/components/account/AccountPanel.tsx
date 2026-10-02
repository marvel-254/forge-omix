import { useCallback, useEffect, useState } from 'react'
import { accountApi, authApi, ApiError, type AccountOverview } from '@client/lib/api'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface AccountPanelProps {
  isOpen: boolean
  onClose: () => void
  onOpenProject: (projectId: string) => void
  onShowPlans: () => void
  onLoggedOut?: () => void
}

function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function AccountPanel({
  isOpen,
  onClose,
  onOpenProject,
  onShowPlans,
  onLoggedOut,
}: AccountPanelProps) {
  const [overview, setOverview] = useState<AccountOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOverview(await accountApi.getOverview())
    } catch (caught) {
      setOverview(null)
      setError(caught instanceof ApiError ? caught.message : 'Could not load account overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) void loadOverview()
  }, [isOpen, loadOverview])

  const signOut = async () => {
    setLoggingOut(true)
    setError(null)
    try {
      await authApi.logout()
      if (onLoggedOut) onLoggedOut()
      else window.location.reload()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not sign out')
      setLoggingOut(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account" description="Your projects, activity, and plan.">
      {loading ? (
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          Loading account overview…
        </p>
      ) : error ? (
        <div role="alert" className="space-y-3">
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          <Button variant="outline" onClick={() => void loadOverview()}>
            Try again
          </Button>
        </div>
      ) : overview ? (
        <div className="space-y-6">
          <section aria-labelledby="account-profile-heading">
            <h3 id="account-profile-heading" className="text-sm font-semibold text-foreground">
              Profile
            </h3>
            <p className="mt-1 text-sm font-medium text-foreground">{overview.account.displayName || 'Account'}</p>
            <p className="text-sm text-muted-foreground">{overview.account.email}</p>
          </section>

          <section aria-labelledby="account-totals-heading">
            <h3 id="account-totals-heading" className="text-sm font-semibold text-foreground">
              Totals
            </h3>
            <dl className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">Projects</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{overview.totals.projects}</dd>
              </div>
              <div className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">Deployments</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{overview.totals.deployments}</dd>
              </div>
              <div className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">Domains</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{overview.totals.domains}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="account-projects-heading">
            <h3 id="account-projects-heading" className="text-sm font-semibold text-foreground">
              Projects
            </h3>
            {overview.projects.length === 0 ? (
              <p role="status" className="mt-2 rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                No projects yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {overview.projects.map((project) => (
                  <li key={project.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{project.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{project.description || 'No description'}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {pluralize(project.deploymentCount, 'deployment')} · {pluralize(project.domainCount, 'domain')}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Updated {formatUpdatedAt(project.updatedAt)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onClose()
                          onOpenProject(project.id)
                        }}
                        aria-label={`Open ${project.name}`}
                      >
                        Open
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onClose()
                onShowPlans()
              }}
            >
              Plans
            </Button>
            <Button variant="destructive" onClick={() => void signOut()} disabled={loggingOut}>
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
