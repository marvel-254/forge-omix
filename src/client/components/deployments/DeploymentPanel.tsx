import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  ApiError,
  deploymentsApi,
  type Deployment,
  type DeploymentLog,
  type DeploymentStatus,
} from '@client/lib/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

type NoticeTone = 'info' | 'warning' | 'success'

interface Notice {
  tone: NoticeTone
  message: string
}

const statusProgress: Record<DeploymentStatus, number> = {
  queued: 15,
  building: 40,
  ready: 60,
  deploying: 75,
  live: 100,
  failed: 0,
  rolled_back: 100,
  deleted: 0,
}

const statusLabels: Record<DeploymentStatus, string> = {
  queued: 'Queued',
  building: 'Building',
  ready: 'Ready',
  deploying: 'Deploying',
  live: 'Live',
  failed: 'Failed',
  rolled_back: 'Rolled back',
  deleted: 'Deleted',
}

const statusClasses: Record<DeploymentStatus, string> = {
  queued: 'bg-neutral-100 text-neutral-700',
  building: 'bg-amber-100 text-amber-800',
  ready: 'bg-blue-100 text-blue-800',
  deploying: 'bg-blue-100 text-blue-800',
  live: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  rolled_back: 'bg-violet-100 text-violet-800',
  deleted: 'bg-neutral-200 text-neutral-600',
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function adapterNotice(action: 'Publishing' | 'Rollback', error: unknown): Notice | null {
  if (error instanceof ApiError && error.code === 'DEPLOY_ADAPTER_NOT_CONFIGURED') {
    return {
      tone: 'warning',
      message: `${action} is unavailable: no deployment adapter is configured (DEPLOY_ADAPTER_NOT_CONFIGURED). No live URL was created.`,
    }
  }
  return null
}

export function DeploymentPanel({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logs, setLogs] = useState<DeploymentLog[]>([])
  const [version, setVersion] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const selected = deployments.find((deployment) => deployment.id === selectedId) ?? null

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

  const loadLogs = useCallback(async (id: string) => {
    setLoadingLogs(true)
    try {
      const result = await deploymentsApi.logs(id)
      setLogs(result.logs)
    } catch (caught) {
      setLogs([])
      setError(caught instanceof ApiError ? caught.message : 'Could not load deployment logs')
    } finally {
      setLoadingLogs(false)
    }
  }, [])

  const loadDeployments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await deploymentsApi.list(projectId)
      setDeployments(result.deployments)
      setSelectedId((current) => {
        if (current && result.deployments.some((deployment) => deployment.id === current)) return current
        return result.deployments[0]?.id ?? null
      })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load deployments')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadDeployments()
  }, [loadDeployments])

  useEffect(() => {
    if (selectedId) void loadLogs(selectedId)
    else setLogs([])
  }, [loadLogs, selectedId])

  const replaceDeployment = useCallback((deployment: Deployment) => {
    setDeployments((current) => {
      const next = current.filter((item) => item.id !== deployment.id)
      return [deployment, ...next]
    })
    setSelectedId(deployment.id)
  }, [])

  const refreshSelectedData = useCallback(async (id: string) => {
    await Promise.all([loadDeployments(), loadLogs(id)])
  }, [loadDeployments, loadLogs])

  const createPreview = async () => {
    setBusyAction('create')
    setError(null)
    setNotice(null)
    try {
      const { deployment } = await deploymentsApi.create({
        projectId,
        environment: 'preview',
        ...(version.trim() ? { version: version.trim() } : {}),
      })
      replaceDeployment(deployment)
      setVersion('')
      setNotice({
        tone: 'info',
        message: `Preview deployment queued. Current status: ${statusLabels[deployment.status]}. It is not live.`,
      })
      await loadLogs(deployment.id)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not create preview deployment')
    } finally {
      setBusyAction(null)
    }
  }

  const startBuild = async (deployment: Deployment) => {
    setBusyAction(deployment.id)
    setError(null)
    setNotice(null)
    try {
      const result = await deploymentsApi.build(deployment.id)
      replaceDeployment(result.deployment)
      setNotice({
        tone: 'info',
        message: `Build started. Server status: ${statusLabels[result.deployment.status]}. No live URL has been created.`,
      })
      await refreshSelectedData(result.deployment.id)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not start deployment build')
    } finally {
      setBusyAction(null)
    }
  }

  const publish = async (deployment: Deployment) => {
    setBusyAction(deployment.id)
    setError(null)
    setNotice(null)
    try {
      const result = await deploymentsApi.publish(deployment.id)
      replaceDeployment(result.deployment)
      const isLive = result.deployment.status === 'live' && Boolean(result.deployment.liveUrl)
      setNotice(
        isLive
          ? { tone: 'success', message: 'Deployment published. The server returned a live URL.' }
          : {
              tone: 'warning',
              message: `Publish response received, but the server reports ${statusLabels[result.deployment.status]}. No live deployment is being claimed.`,
            }
      )
      await refreshSelectedData(result.deployment.id)
    } catch (caught) {
      const adapterError = adapterNotice('Publishing', caught)
      setNotice(adapterError)
      setError(
        adapterError
          ? null
          : caught instanceof ApiError
            ? caught.message
            : 'Could not publish deployment'
      )
    } finally {
      setBusyAction(null)
    }
  }

  const rollback = async (deployment: Deployment) => {
    setBusyAction(deployment.id)
    setError(null)
    setNotice(null)
    try {
      const result = await deploymentsApi.rollback(deployment.id)
      replaceDeployment(result.deployment)
      setNotice({
        tone: result.deployment.status === 'rolled_back' ? 'success' : 'warning',
        message:
          result.deployment.status === 'rolled_back'
            ? 'Rollback completed. Server status: rolled back.'
            : `Rollback response received, but the server reports ${statusLabels[result.deployment.status]}.`,
      })
      await refreshSelectedData(result.deployment.id)
    } catch (caught) {
      const adapterError = adapterNotice('Rollback', caught)
      setNotice(adapterError)
      setError(
        adapterError
          ? null
          : caught instanceof ApiError
            ? caught.message
            : 'Could not roll back deployment'
      )
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
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
      >
        <div className="flex items-center gap-3 border-b px-4 py-2.5">
          <div>
            <h2 id={titleId} className="text-sm font-semibold text-neutral-900">
              Deployments
            </h2>
            <p className="text-xs text-neutral-500">Project {projectId}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => void loadDeployments()} disabled={loading}>
              Refresh
            </Button>
            <Button
              ref={closeButtonRef}
              size="sm"
              variant="ghost"
              onClick={onClose}
              aria-label="Close deployments"
            >
              ×
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {notice && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-4 rounded-md border px-3 py-2 text-sm ${
                notice.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : notice.tone === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-blue-200 bg-blue-50 text-blue-900'
              }`}
            >
              {notice.message}
            </div>
          )}
          {error && (
            <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <section aria-labelledby="create-preview-heading" className="rounded-lg border bg-neutral-50 p-3">
            <h3 id="create-preview-heading" className="text-sm font-semibold text-neutral-900">
              Create preview deployment
            </h3>
            <form
              className="mt-2 flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                void createPreview()
              }}
            >
              <div className="min-w-48 flex-1">
                <Input
                  label="Version (optional)"
                  value={version}
                  placeholder={selected?.version ?? 'Uses the project version'}
                  onChange={(event) => setVersion(event.target.value)}
                />
              </div>
              <Button type="submit" size="sm" disabled={busyAction !== null}>
                {busyAction === 'create' ? 'Queuing…' : 'Create preview'}
              </Button>
            </form>
          </section>

          <div className="mt-4 grid min-h-80 gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
            <section aria-labelledby="deployment-history-heading">
              <div className="mb-2 flex items-center justify-between">
                <h3 id="deployment-history-heading" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  History
                </h3>
                {loading && <span className="text-xs text-neutral-400">Loading…</span>}
              </div>
              {deployments.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-neutral-500">
                  No deployments yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {deployments.map((deployment) => (
                    <li key={deployment.id}>
                      <button
                        type="button"
                        aria-pressed={deployment.id === selectedId}
                        onClick={() => setSelectedId(deployment.id)}
                        className={`w-full rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                          deployment.id === selectedId
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-neutral-900">
                            {deployment.environment}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClasses[deployment.status]}`}>
                            {statusLabels[deployment.status]}
                          </span>
                        </span>
                        <span className="mt-1 block truncate text-xs text-neutral-500">
                          {deployment.version ?? 'No version'} · {formatTimestamp(deployment.createdAt)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="deployment-details-heading" className="min-w-0 rounded-lg border p-4">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 id="deployment-details-heading" className="text-sm font-semibold text-neutral-900">
                      {selected.environment} deployment
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[selected.status]}`}>
                      {statusLabels[selected.status]}
                    </span>
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-neutral-400">{selected.id}</p>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-neutral-500">
                      <span>Lifecycle progress</span>
                      <span>{statusProgress[selected.status]}%</span>
                    </div>
                    <progress
                      className="h-2 w-full accent-primary-500"
                      max={100}
                      value={statusProgress[selected.status]}
                      aria-label={`Deployment lifecycle progress: ${statusLabels[selected.status]}`}
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      Server status: {statusLabels[selected.status]}. Progress reflects the lifecycle stage, not build completion.
                    </p>
                  </div>

                  {selected.failure && (
                    <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
                      <h4 className="text-xs font-semibold text-red-900">Failure</h4>
                      <p className="mt-1 break-words text-sm text-red-800">{selected.failure}</p>
                    </div>
                  )}

                  <dl className="mt-4 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="text-neutral-400">Version</dt>
                      <dd className="mt-0.5 text-neutral-700">{selected.version ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-400">Commit</dt>
                      <dd className="mt-0.5 break-all font-mono text-neutral-700">{selected.commitHash ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-400">Created</dt>
                      <dd className="mt-0.5 text-neutral-700">{formatTimestamp(selected.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-400">Updated</dt>
                      <dd className="mt-0.5 text-neutral-700">{formatTimestamp(selected.updatedAt)}</dd>
                    </div>
                  </dl>

                  {(selected.previewUrl || selected.liveUrl) && (
                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                      {selected.previewUrl && (
                        <a
                          className="font-medium text-primary-700 underline underline-offset-2"
                          href={selected.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open preview URL
                        </a>
                      )}
                      {selected.liveUrl && (
                        <a
                          className="font-medium text-primary-700 underline underline-offset-2"
                          href={selected.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open live URL
                        </a>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                    <Button
                      size="sm"
                      onClick={() => void startBuild(selected)}
                      disabled={busyAction !== null || selected.status !== 'queued'}
                    >
                      Start build
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void publish(selected)}
                       disabled={busyAction !== null || selected.status !== 'ready'}
                    >
                      Publish
                    </Button>
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => void rollback(selected)}
                       disabled={busyAction !== null || !['ready', 'live'].includes(selected.status)}
                     >
                       Roll back
                     </Button>
                  </div>

                  <div className="mt-5 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Logs</h4>
                      <Button size="sm" variant="ghost" onClick={() => void loadLogs(selected.id)} disabled={loadingLogs}>
                        {loadingLogs ? 'Loading…' : 'Reload logs'}
                      </Button>
                    </div>
                    {loadingLogs ? (
                      <p className="mt-2 text-xs text-neutral-400">Loading logs…</p>
                    ) : logs.length === 0 ? (
                      <p className="mt-2 text-xs text-neutral-400">No lifecycle logs returned.</p>
                    ) : (
                      <ol className="mt-2 space-y-1.5">
                        {logs.map((log) => (
                          <li key={log.id} className="rounded-md bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-100">
                            <div className="flex flex-wrap gap-x-2 text-neutral-400">
                              <time dateTime={log.createdAt}>{formatTimestamp(log.createdAt)}</time>
                              <span>{log.event}</span>
                            </div>
                            <p className="mt-0.5">{log.message}</p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                  Select or create a deployment to inspect its status and logs.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeploymentPanel
