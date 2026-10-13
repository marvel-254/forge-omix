import { useEffect, useState } from 'react'
import { listCommentsByPage, type Comment } from '../../lib/commentApi'

/**
 * Renders approved comments for a page (WordPress comment section parity).
 * Fetches on mount and refreshes when the page changes.
 */
export function CommentList({ pageId }: { pageId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listCommentsByPage(pageId)
      .then((rows) => {
        if (!cancelled) setComments(rows)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load comments')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pageId])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading comments…</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts.</p>
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{comment.author}</p>
            <time className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </time>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{comment.content}</p>
        </li>
      ))}
    </ul>
  )
}
