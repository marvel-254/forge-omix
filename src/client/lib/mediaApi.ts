import type { ApiResponse } from '@/types'

/**
 * Media library client (docs/17).
 *
 * Mirrors the conventions in `api.ts`: same base-URL resolution, same
 * `{ success, data?, error? }` envelope, same error class shape. Kept as a
 * separate module rather than folded into `api.ts` so the media surface can
 * be reasoned about (and re-pointed at a different transport) on its own.
 */

const API_BASE: string =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ??
  'http://localhost:3001'

/**
 * Formats the server accepts. Mirrors `ACCEPTED_MIME_TYPES` in
 * `src/server/services/mediaService.ts` — the server revalidates every
 * upload, so this copy exists purely to build a useful `accept` attribute
 * and to reject hopeless files before spending a round trip. It cannot import
 * the server module: that one pulls in `node:fs` and must never reach the
 * client bundle.
 */
export const ACCEPTED_MIME_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
]

/** `accept` attribute value for the upload input. */
export const MEDIA_ACCEPT_ATTRIBUTE = ACCEPTED_MIME_TYPES.join(',')

/** Mirrors `MAX_UPLOAD_BYTES` on the server (25 MB). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

/** How the canvas renders an asset: `image`/`gif` → `<img>`, `video` → `<video>`. */
export type MediaType = 'image' | 'gif' | 'video'

/**
 * A stored asset as returned by `POST /api/media` and `GET /api/media`.
 *
 * `width`/`height`/`createdAt` are only measured/stamped for stored rows, so
 * a freshly uploaded asset legitimately lacks them until the next list fetch.
 */
export interface MediaAsset {
  id: string
  /** Public serving URL, e.g. `/api/media/files/<storedName>`. */
  url: string
  filename: string
  mimeType: string
  mediaType: MediaType
  byteSize: number
  alt: string | null
  width?: number | null
  height?: number | null
  createdAt?: string
}

export class MediaApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'MediaApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Multipart bodies need the browser-generated boundary, so the JSON
  // Content-Type is only applied to non-FormData requests.
  const isMultipart = typeof FormData !== 'undefined' && init?.body instanceof FormData

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...(isMultipart ? {} : { headers: { 'Content-Type': 'application/json' } }),
    ...init,
  })

  let body: ApiResponse<T> | null = null
  try {
    body = (await response.json()) as ApiResponse<T>
  } catch {
    // Non-JSON response (proxy error page, empty body, ...)
  }

  if (!response.ok || !body?.success) {
    throw new MediaApiError(
      body?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body?.error?.code ?? 'UNKNOWN'
    )
  }

  return body.data as T
}

export interface MediaUploadInput {
  file: File
  /** Attach the asset to a project; the server verifies ownership. */
  projectId?: string
  /** Alternative text. Images are unusable in a canvas without it. */
  alt?: string
}

export const mediaApi = {
  /** Newest first, capped server-side at 200 rows. */
  list: () => request<MediaAsset[]>('/api/media'),

  upload: ({ file, projectId, alt }: MediaUploadInput) => {
    const body = new FormData()
    body.append('file', file)
    if (projectId) body.append('projectId', projectId)
    if (alt) body.append('alt', alt)

    return request<MediaAsset>('/api/media', { method: 'POST', body })
  },

  remove: (id: string) =>
    request<{ id: string }>(`/api/media/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}