import { useState } from 'react'
import { feedbackApi, ApiError } from '@client/lib/api'
import { Button } from '../ui/Button'

/**
 * Beta feedback widget (Phase 13): floating button + modal form posting to
 * the validated /api/feedback endpoint. Contact is optional; nothing
 * identifying is collected automatically.
 */
export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState('bug')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!message.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await feedbackApi.submit({
        kind,
        message: message.trim(),
        ...(contact.trim() ? { contact: contact.trim() } : {}),
      })
      setSent(true)
      setMessage('')
      setContact('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send feedback')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setSent(false)
          setError(null)
        }}
        className="fixed bottom-4 right-4 z-[90] rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-md transition-colors hover:bg-neutral-50"
      >
        Feedback
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Send feedback"
          >
            <h2 className="mb-3 text-base font-semibold tracking-tight text-neutral-900">
              Send feedback
            </h2>
            {sent ? (
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-800">Thanks — feedback received.</p>
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-neutral-600" htmlFor="feedback-kind">
                      Type
                    </label>
                    <select
                      id="feedback-kind"
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="bug">Bug report</option>
                      <option value="idea">Feature idea</option>
                      <option value="praise">Praise</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-neutral-600" htmlFor="feedback-message">
                      Message
                    </label>
                    <textarea
                      id="feedback-message"
                      value={message}
                      rows={4}
                      maxLength={2000}
                      placeholder="What happened, or what would you like to see?"
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-neutral-600" htmlFor="feedback-contact">
                      Contact (optional)
                    </label>
                    <input
                      id="feedback-contact"
                      value={contact}
                      placeholder="Email or handle, if you want a reply"
                      onChange={(e) => setContact(e.target.value)}
                      className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => void submit()} disabled={busy || !message.trim()}>
                    {busy ? 'Sending…' : 'Send'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default FeedbackWidget
