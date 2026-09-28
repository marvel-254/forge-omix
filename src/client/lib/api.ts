import type { ApiResponse } from '@/types'

/**
 * Client API layer for the forge@omix builder.
 * Wraps the Hono API (port 3001 in dev, /api via nginx in prod).
 */

const API_BASE: string =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ??
  'http://localhost:3001'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  let body: ApiResponse<T> | null = null
  try {
    body = (await response.json()) as ApiResponse<T>
  } catch {
    // Non-JSON response (proxy error page, empty body, ...)
  }

  if (!response.ok || !body?.success) {
    throw new ApiError(
      body?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body?.error?.code ?? 'UNKNOWN'
    )
  }

  return body.data as T
}

// --- Projects ---

export interface ProjectRow {
  id: string
  name: string
  description: string | null
  version: string
  framework: string
  cssStrategy: string
  routerMode: string
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
  role: string
}

export interface AuthResult {
  token: string
  user: AuthUser
}

export const authApi = {
  register: (payload: { email: string; password: string; displayName?: string }) =>
    request<AuthResult>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<{ user: AuthUser }>('/api/auth/me'),

  logout: () => request<{ loggedOut: true }>('/api/auth/logout', { method: 'POST' }),
}

export interface AccountOverview {
  account: AuthUser
  projects: Array<{
    id: string
    name: string
    description: string | null
    updatedAt: string
    deploymentCount: number
    domainCount: number
  }>
  totals: {
    projects: number
    deployments: number
    domains: number
  }
}

export const accountApi = {
  getOverview: () => request<AccountOverview>('/api/account/overview'),
}

export const projectsApi = {
  list: () => request<ProjectRow[]>('/api/projects'),

  get: (id: string) => request<ProjectRow>(`/api/projects/${id}`),

  /** Reassembled canonical project (composite across all tables). */
  getComposite: (id: string) => request<Record<string, unknown>>(`/api/projects/${id}/project`),

  create: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Aggregate save of the full canonical project. */
  saveComposite: (id: string, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/projects/${id}/project`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    request<ProjectRow>(`/api/projects/${id}`, { method: 'DELETE' }),
}

export interface CommerceMoney {
  amountMinor: number
  currency: string
}

export interface HostingPlanPricing {
  promotional: CommerceMoney
  renewal: CommerceMoney
  termMonths: number
  billingInterval: 'month' | 'year'
  upfront: true
}

export interface HostingPlan {
  id: string
  slug: string
  name: string
  audience: string
  description: string
  limits: {
    websites: number
    storageGb: number
    monthlyVisits: number
  }
  features: string[]
  pricing: HostingPlanPricing
  trialPeriodDays?: number
  gracePeriodDays?: number
}

export type CheckoutTermMonths = 12 | 36
export type CheckoutStatus = 'draft' | 'pending_payment' | 'completed' | 'cancelled'

export interface CheckoutSession {
  id: string
  accountId: string
  projectId: string
  planId: string
  planSnapshot: HostingPlan
  termMonths: CheckoutTermMonths
  status: CheckoutStatus
  promotionalTotal: number
  renewalTotal: number
  currency: string
  createdAt: string
  updatedAt: string
  paymentReference?: string
}

export interface CreateCheckoutSessionInput {
  projectId: string
  planId: string
  termMonths: CheckoutTermMonths
}

export const commerceApi = {
  plans: () => request<{ plans: HostingPlan[] }>('/api/plans'),

  createCheckoutSession: (payload: CreateCheckoutSessionInput) =>
    request<{ checkout: CheckoutSession }>('/api/checkout/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCheckoutSession: (id: string) =>
    request<{ checkout: CheckoutSession }>(`/api/checkout/sessions/${encodeURIComponent(id)}`),

  confirmCheckoutSession: (id: string) =>
    request<{ checkout: CheckoutSession }>(`/api/checkout/sessions/${encodeURIComponent(id)}/confirm`, {
      method: 'POST',
    }),
}

export type DomainStatus =
  | 'searching'
  | 'available'
  | 'reserved'
  | 'pending'
  | 'registered'
  | 'connected'
  | 'renewal_due'
  | 'expiring'
  | 'expired'

export type DomainOwnership = 'owned' | 'external' | 'unknown'
export type DomainRegistrationStatus =
  | 'not_registered'
  | 'pending'
  | 'registered'
  | 'transferring'
  | 'expired'
  | 'cancelled'
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
  availability: unknown
  verification: 'not_checked'
  source: 'no_registrar'
}

export interface CreateDomainInput {
  name: string
  projectId?: string
}

export const domainsApi = {
  search: (query: string) =>
    request<{ results: DomainSearchResult[] }>(`/api/domains/search?q=${encodeURIComponent(query)}`),

  list: () => request<{ domains: Domain[] }>('/api/domains'),

  create: (payload: CreateDomainInput) =>
    request<{ domain: Domain }>('/api/domains', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  connect: (id: string, projectId: string) =>
    request<{ domain: Domain }>(`/api/domains/${encodeURIComponent(id)}/connect`, {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),

  disconnect: (id: string) =>
    request<{ domain: Domain }>(`/api/domains/${encodeURIComponent(id)}/disconnect`, {
      method: 'POST',
    }),

  register: (id: string) =>
    request<{ domain: Domain }>(`/api/domains/${encodeURIComponent(id)}/register`, {
      method: 'POST',
    }),
}

// --- Deployments ---

export type DeploymentEnvironment = 'preview' | 'staging' | 'production'
export type DeploymentStatus =
  | 'queued'
  | 'building'
  | 'ready'
  | 'deploying'
  | 'live'
  | 'failed'
  | 'rolled_back'
  | 'deleted'

export interface DeploymentLog {
  id: string
  deploymentId: string
  accountId: string
  event: string
  message: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface Deployment {
  id: string
  accountId: string
  projectId: string
  environment: DeploymentEnvironment
  status: DeploymentStatus
  version: string | null
  previewUrl: string | null
  liveUrl: string | null
  commitHash: string | null
  commitMessage?: string | null
  commitAuthor?: string | null
  failure: string | null
  startedAt: string | null
  completedAt: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  logs?: DeploymentLog[]
}

export interface CreateDeploymentInput {
  projectId: string
  environment: DeploymentEnvironment
  version?: string
}

export const deploymentsApi = {
  create: (payload: CreateDeploymentInput) =>
    request<{ deployment: Deployment }>('/api/deployments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  list: (projectId: string) =>
    request<{ deployments: Deployment[] }>(
      `/api/deployments?projectId=${encodeURIComponent(projectId)}`
    ),

  get: (id: string) =>
    request<{ deployment: Deployment }>(`/api/deployments/${encodeURIComponent(id)}`),

  build: (id: string) =>
    request<{ deployment: Deployment }>(`/api/deployments/${encodeURIComponent(id)}/build`, {
      method: 'POST',
    }),

  publish: (id: string) =>
    request<{ deployment: Deployment }>(`/api/deployments/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
    }),

  rollback: (id: string) =>
    request<{ deployment: Deployment }>(`/api/deployments/${encodeURIComponent(id)}/rollback`, {
      method: 'POST',
    }),

  logs: (id: string) =>
    request<{ logs: DeploymentLog[] }>(`/api/deployments/${encodeURIComponent(id)}/logs`),
}

// --- Git workspaces ---

export interface GitStatus {
  isRepo: boolean
  branch: string
  ahead: number
  behind: number
  staged: string[]
  modified: string[]
  untracked: string[]
  clean: boolean
}

export interface GitLogEntry {
  hash: string
  message: string
  author: string
  date: string
}

function gitPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return request<T>(`/api/git${path}`, { method: 'POST', body: JSON.stringify(body) })
}

export type AiCreationSessionStep = 'brief' | 'clarify' | 'assets' | 'review'
export type AiCreationSessionStatus = 'draft' | 'generating' | 'ready' | 'failed'

export interface AiCreationSession {
  id: string
  status: AiCreationSessionStatus
  step: AiCreationSessionStep
  brief: string
  projectName: string
  clarifications: Record<string, string>
  assets: {
    logo?: { name?: string; url?: string; altText?: string } | null
    photo?: { name?: string; url?: string; altText?: string } | null
  }
  generatedProject: Record<string, unknown> | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface AiCreationSessionInput {
  brief: string
  projectName?: string
  clarifications?: Record<string, string>
  assets?: AiCreationSession['assets']
}

export interface AiCreationSessionUpdate {
  step?: AiCreationSessionStep
  brief?: string
  projectName?: string
  clarifications?: Record<string, string>
  assets?: AiCreationSession['assets']
}

export const aiApi = {
  models: () => request<Array<{ id: string; name: string; provider: string }>>('/api/ai/models'),

  createCreationSession: (payload: AiCreationSessionInput) =>
    request<{ session: AiCreationSession }>('/api/ai/creation/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCreationSession: (id: string) =>
    request<{ session: AiCreationSession }>(`/api/ai/creation/sessions/${encodeURIComponent(id)}`),

  updateCreationSession: (id: string, payload: AiCreationSessionUpdate) =>
    request<{ session: AiCreationSession }>(`/api/ai/creation/sessions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  generateCreationSession: (id: string) =>
    request<{ session: AiCreationSession }>(`/api/ai/creation/sessions/${encodeURIComponent(id)}/generate`, {
      method: 'POST',
    }),

  /** Read an SSE stream, invoking onChunk per content frame. */
  streamChat: async (
    body: Record<string, unknown>,
    onChunk: (content: string) => void
  ): Promise<void> => {
    const base: string =
      (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ??
      'http://localhost:3001'
    const res = await fetch(`${base}/api/ai/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok || !res.body) {
      let message = `Request failed with status ${res.status}`
      try {
        const err = (await res.json()) as ApiResponse<never>
        message = err?.error?.message ?? message
      } catch {
        // Keep the status message.
      }
      throw new ApiError(message, res.status, 'AI_STREAM_ERROR')
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const frames = buffer.split('\n')
      buffer = frames.pop() ?? ''
      for (const frame of frames) {
        const line = frame.trim()
        if (!line.startsWith('data:')) continue
        try {
          const chunk = JSON.parse(line.slice(5).trim()) as {
            content?: string
            done?: boolean
            error?: string
          }
          if (typeof chunk.error === 'string' && chunk.error) {
            throw new ApiError(chunk.error, 502, 'AI_STREAM_ERROR')
          }
          if (typeof chunk.content === 'string' && chunk.content) onChunk(chunk.content)
        } catch (error) {
          if (error instanceof ApiError) throw error
          // Skip malformed frames.
        }
      }
    }
  },
}

export const feedbackApi = {
  submit: (payload: { kind: string; message: string; contact?: string; appVersion?: string }) =>
    request<{ id: string }>('/api/feedback', { method: 'POST', body: JSON.stringify(payload) }),
}

export const gitApi = {
  init: (dir: string) => gitPost<{ path: string; initialized: boolean }>('/init', { dir }),
  status: (dir: string) => gitPost<GitStatus>('/status', { dir }),
  commit: (dir: string, message: string) =>
    gitPost<{ commit: string; changes: number }>('/commit', { dir, message }),
  branches: (dir: string) => gitPost<{ current: string; all: string[] }>('/branches', { dir }),
  checkout: (dir: string, branch: string, create = false) =>
    gitPost<{ current: string }>('/checkout', { dir, branch, create }),
  log: (dir: string) => gitPost<GitLogEntry[]>('/log', { dir }),
  diff: (dir: string, file: string) =>
    gitPost<{ file: string; diff: string }>('/diff', { dir, file }),
  changedSince: (dir: string, ref: string) =>
    gitPost<{ ref: string; files: string[] }>('/changed-since', { dir, ref }),
  push: (dir: string) => gitPost<{ result: string }>('/push', { dir }),
  pull: (dir: string) => gitPost<{ result: string }>('/pull', { dir }),
}
