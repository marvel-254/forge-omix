import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  ApiError,
  domainsApi,
  type Domain,
  type DomainConnectionStatus,
  type DomainSearchResult,
} from '@client/lib/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface DomainPanelProps {
  projectId: string
  onClose: () => void
}

function normalizeDomainQuery(value: string): string {
  return value.trim().toLowerCase()
}

function connectionStatus(domain: Domain): DomainConnectionStatus {
  if (domain.hostingConnection?.status) return domain.hostingConnection.status
  if (domain.status === 'connected') return 'connected'
  if (domain.status === 'pending') return 'pending'
  return 'disconnected'
}

function connectionLabel(status: DomainConnectionStatus): string {
  if (status === 'pending') return 'Pending DNS verification'
  if (status === 'connected') return 'Connected'
  if (status === 'error') return 'Connection error'
  return 'Not connected'
}

function registrarBoundaryMessage(error: unknown): string | null {
  if (error instanceof ApiError && error.code === 'DOMAIN_REGISTRAR_NOT_CONFIGURED') {
    return 'Registration is unavailable because no domain registrar is configured (DOMAIN_REGISTRAR_NOT_CONFIGURED). No registration was created.'
  }
  return null
}

export function normalizeDomain(value: string): string {
  return normalizeDomainQuery(value)
}

export function DomainPanel({ projectId, onClose }: DomainPanelProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DomainSearchResult[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

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

  const loadDomains = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await domainsApi.list()
      setDomains(result.domains)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load domains')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDomains()
  }, [loadDomains])

  const replaceDomain = useCallback((domain: Domain) => {
    setDomains((current) => {
      const existing = current.some((item) => item.id === domain.id)
      return existing
        ? current.map((item) => (item.id === domain.id ? domain : item))
        : [domain, ...current]
    })
  }, [])

  const search = useCallback(async () => {
    const normalized = normalizeDomainQuery(query)
    if (!normalized) {
      setError('Enter a domain name to search.')
      return
    }
    setSearching(true)
    setError(null)
    setNotice(null)
    try {
      const result = await domainsApi.search(normalized)
      setResults(result.results)
      setNotice('Availability is unknown and has not been checked because no registrar is configured.')
    } catch (caught) {
      setResults([])
      setError(caught instanceof ApiError ? caught.message : 'Could not search for the domain')
    } finally {
      setSearching(false)
    }
  }, [query])

  const saveDomain = useCallback(
    async (result: DomainSearchResult) => {
      setBusyAction(`save-${result.name}`)
      setError(null)
      setNotice(null)
      try {
        const response = await domainsApi.create({ name: result.name, projectId })
        replaceDomain(response.domain)
        setNotice(`${response.domain.name} was saved as a desired domain. Registration availability is still unknown.`)
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'Could not save the domain')
      } finally {
        setBusyAction(null)
      }
    },
    [projectId, replaceDomain]
  )

  const runDomainAction = useCallback(
    async (
      key: string,
      operation: () => Promise<{ domain: Domain }>,
      successMessage: (domain: Domain) => string
    ) => {
      setBusyAction(key)
      setError(null)
      setNotice(null)
      try {
        const response = await operation()
        replaceDomain(response.domain)
        setNotice(successMessage(response.domain))
      } catch (caught) {
        const boundaryMessage = registrarBoundaryMessage(caught)
        setError(
          boundaryMessage ??
            (caught instanceof ApiError ? caught.message : 'The domain operation failed')
        )
      } finally {
        setBusyAction(null)
      }
    },
    [replaceDomain]
  )

  const connectDomain = useCallback(
    (domain: Domain) =>
      void runDomainAction(
        `connect-${domain.id}`,
        () => domainsApi.connect(domain.id, projectId),
        (updated) =>
          updated.hostingConnection?.status === 'pending' || updated.status === 'pending'
            ? 'Connection request saved. The server reports pending DNS verification. This domain is not verified or live yet.'
            : `Connection response received. The server reports ${connectionLabel(connectionStatus(updated))}.`
      ),
    [projectId, runDomainAction]
  )

  const disconnectDomain = useCallback(
    (domain: Domain) =>
      void runDomainAction(
        `disconnect-${domain.id}`,
        () => domainsApi.disconnect(domain.id),
        (updated) => `${updated.name} was disconnected from this project.`
      ),
    [runDomainAction]
  )

  const registerDomain = useCallback(
    (domain: Domain) =>
      void runDomainAction(
        `register-${domain.id}`,
        () => domainsApi.register(domain.id),
        () => 'The server returned a registration response. Registration is not claimed by this client.'
      ),
    [runDomainAction]
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
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
        aria-busy={loading || searching || busyAction !== null}
      >
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-neutral-900">
              Domains
            </h2>
            <p className="mt-1 text-sm text-neutral-500">Manage domains for project {projectId}.</p>
          </div>
          <Button
            ref={closeButtonRef}
            className="ml-auto"
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close domains"
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

          <section aria-labelledby="domain-search-heading" className="rounded-lg border bg-neutral-50 p-4">
            <h3 id="domain-search-heading" className="text-sm font-semibold text-neutral-900">
              Search for a domain
            </h3>
            <p className="mt-1 text-xs text-neutral-600">
              Search results do not confirm availability. No registrar is connected.
            </p>
            <form
              className="mt-3 flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                void search()
              }}
            >
              <div className="min-w-56 flex-1">
                <Input
                  id="domain-search-input"
                  label="Domain name"
                  value={query}
                  placeholder="example.com"
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={searching || busyAction !== null}>
                {searching ? 'Searching…' : 'Search'}
              </Button>
            </form>

            {results.length > 0 && (
              <ul className="mt-4 space-y-2" aria-label="Domain search results">
                {results.map((result) => (
                  <li key={result.name} className="flex flex-wrap items-center gap-3 rounded-md border bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-medium text-neutral-900">{result.name}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Availability: {String(result.availability)} · Verification: {result.verification.replace('_', ' ')} · Source: {result.source.replace('_', ' ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => void saveDomain(result)}
                      disabled={busyAction !== null}
                    >
                      {busyAction === `save-${result.name}` ? 'Saving…' : 'Save desired domain'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="account-domains-heading" className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 id="account-domains-heading" className="text-sm font-semibold text-neutral-900">
                Account domains
              </h3>
              <Button size="sm" variant="outline" onClick={() => void loadDomains()} disabled={loading || busyAction !== null}>
                {loading ? 'Loading…' : 'Refresh'}
              </Button>
            </div>
            {loading && domains.length === 0 ? (
              <p className="text-sm text-neutral-500">Loading domains…</p>
            ) : domains.length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-neutral-500">
                No domains saved for this account.
              </p>
            ) : (
              <ul className="space-y-3" aria-label="Saved domains">
                {domains.map((domain) => {
                  const currentConnection = connectionStatus(domain)
                  const isConnected = currentConnection === 'connected'
                  const isPending = currentConnection === 'pending'
                  return (
                    <li key={domain.id} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="break-all text-sm font-semibold text-neutral-900">{domain.name}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {connectionLabel(currentConnection)} · Registration: {domain.registration.status.replace('_', ' ')}
                          </p>
                          {isPending && (
                            <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900">
                              Pending DNS verification. This domain is not verified or live yet.
                            </p>
                          )}
                          {isConnected && domain.hostingConnection?.verifiedAt && (
                            <p className="mt-2 text-xs text-emerald-700">Server verification recorded at {domain.hostingConnection.verifiedAt}.</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!isConnected && (
                            <Button
                              size="sm"
                              onClick={() => connectDomain(domain)}
                              disabled={busyAction !== null || isPending}
                            >
                              {busyAction === `connect-${domain.id}` ? 'Connecting…' : 'Connect'}
                            </Button>
                          )}
                          {(isConnected || isPending || domain.hostingConnection?.projectId === projectId) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => disconnectDomain(domain)}
                              disabled={busyAction !== null}
                            >
                              {busyAction === `disconnect-${domain.id}` ? 'Disconnecting…' : 'Disconnect'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => registerDomain(domain)}
                            disabled={busyAction !== null}
                          >
                            {busyAction === `register-${domain.id}` ? 'Checking…' : 'Register'}
                          </Button>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-neutral-500">
                        Registration is unavailable while no registrar is configured. A domain can be saved and connected, but registration is not claimed.
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
