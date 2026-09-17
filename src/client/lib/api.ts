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
