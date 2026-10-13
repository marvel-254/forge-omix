import { useState } from 'react'
import { createComment } from '../../lib/commentApi'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

/**
 * Comment submission form (WordPress comment form parity, free).
 * Posts a comment for the current page; the list refreshes on success.
 */
export function CommentForm({
  projectId,
  pageId,
  onPosted,
}: {
  projectId?: string | null
  pageId: string
  onPosted: () => void
}) {
  const [author, setAuthor] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!author.trim() || !content.trim()) {
      setStatus('Please fill in your name and a comment.')
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      await createComment({ projectId, pageId, author: author.trim(), email: email.trim() || null, content: content.trim() })
      setAuthor('')
      setEmail('')
      setContent('')
      setStatus('Thanks! Your comment has been posted.')
      onPosted()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to post comment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          value={author}
          placeholder="Your name"
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <Input
          label="Email (optional)"
          type="email"
          value={email}
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="comment-content" className="block text-sm font-medium text-foreground">
          Comment
        </label>
        <textarea
          id="comment-content"
          value={content}
          placeholder="Share your thoughts…"
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
      <Button type="submit" disabled={busy}>
        {busy ? 'Posting…' : 'Post comment'}
      </Button>
    </form>
  )
}
