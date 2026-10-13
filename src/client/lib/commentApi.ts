import type { ApiResponse } from '@/types'

/**
 * Comment client (WordPress parity, free).
 *
 * Mirrors the conventions in `api.ts`: same base-URL resolution, same
 * `{ success, data?, error? }` envelope. Kept as a separate module so the
 * comment surface can be reasoned about on its own.
 */

const API_BASE: string =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ??
  'http://localhost:3001'

export interface Comment {
  id: string
  projectId: string | null
  pageId: string | null
  author: string
  email: string | null
  content: string
  status: string
  createdAt: string
}

export interface CommentInput {
  projectId?: string | null
  pageId?: string | null
  author: string
  email?: string | null
  content: string
}

/** Create a comment. Requires an authenticated session. */
export async function createComment(input: CommentInput): Promise<Comment> {
  const response = await fetch(`${API_BASE}/api/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  const json = (await response.json()) as ApiResponse<{ comment: Comment }>
  if (!json.success || !json.data) throw new Error(json.error?.message ?? 'Failed to create comment')
  return json.data.comment
}

/** List approved comments for a page. Public — no auth required. */
export async function listCommentsByPage(pageId: string): Promise<Comment[]> {
  const response = await fetch(`${API_BASE}/api/comments/page/${encodeURIComponent(pageId)}`, {
    credentials: 'include',
  })
  const json = (await response.json()) as ApiResponse<{ comments: Comment[] }>
  if (!json.success || !json.data) throw new Error(json.error?.message ?? 'Failed to fetch comments')
  return json.data.comments
}
