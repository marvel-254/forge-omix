import { useEffect, useMemo, useRef, useState } from 'react'
import { aiApi, ApiError } from '@client/lib/api'
import { useSchemaStore } from '../../store/schemaStore'
import { buildSystemPrompt } from '@server/ai/prompts'
import { filterContext, type ContextLevel } from '@server/ai/context'
import { extractJsonBlocks, validateAiOperation, type AiOperation } from '@server/ai/response'
import type { Component, Page } from '@client/types/schema'
import type { AiCreationState, AiProjectCreationResult } from '@client/lib/aiCreation'
import { AIProjectCreationWizard } from './AIProjectCreationWizard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

/**
 * AI assistant panel (Phase 9, docs/09 §9.8 V1): chat with project context,
 * streaming replies, and validated component/page operations extracted from
 * responses (§9.9 → §2.3.3 validate-then-apply flow).
 */

interface ChatEntry {
  role: 'user' | 'assistant'
  content: string
}

interface PendingOp {
  key: string
  operation: AiOperation
}

function freshId(prefix: 'comp' | 'page'): string {
  return `${prefix}_` + Math.random().toString(36).slice(2, 10)
}

export function AIPanel({
  onClose,
  onCreateProject,
  creationSessionId,
  initialCreationState,
}: {
  onClose: () => void
  onCreateProject?: (result: AiProjectCreationResult) => { valid: boolean }
  creationSessionId?: string
  initialCreationState?: AiCreationState
}) {
  const project = useSchemaStore((s) => s.project)
  const activePageId = useSchemaStore((s) => s.activePageId)
  const addComponentToPage = useSchemaStore((s) => s.actions.addComponentToPage)
  const addPage = useSchemaStore((s) => s.actions.addPage)

  const [models, setModels] = useState<Array<{ id: string; name: string }> | null>(null)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [model, setModel] = useState('')
  const [level, setLevel] = useState<ContextLevel>('minimal')
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingOps, setPendingOps] = useState<PendingOp[]>([])
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [creationOpen, setCreationOpen] = useState(false)
  const sessionId = useMemo(
    () => 'sess_' + Math.random().toString(36).slice(2, 10),
    []
  )
  const loadedModels = useRef(false)

  useEffect(() => {
    if (loadedModels.current) return
    loadedModels.current = true
    aiApi
      .models()
      .then((list) => {
        setModels(list)
        if (list.length > 0) {
          setModel((prev) => prev || list[0].id)
        }
      })
      .catch((e: unknown) => {
        setModelsError(
          e instanceof ApiError
            ? e.message
            : 'AI is not configured (set OPENROUTER_API_KEY or AI_MODE=local|mock)'
        )
      })
  }, [])

  const send = async () => {
    const query = draft.trim()
    if (!query || streaming || !project) return
    setError(null)
    setDraft('')
    const history: ChatEntry[] = [...entries, { role: 'user' as const, content: query }]
    setEntries(history)

    const filtered = filterContext(
      project as unknown as Parameters<typeof filterContext>[0],
      level
    )
    const system = buildSystemPrompt({
      project: filtered as unknown as Parameters<typeof buildSystemPrompt>[0]['project'],
      currentPageId: activePageId ?? undefined,
      userQuery: query,
    })
    const messages = [
      { role: 'system' as const, content: system },
      ...history.map((e) => ({ role: e.role, content: e.content })),
    ]

    setStreaming(true)
    let full = ''
    try {
      await aiApi.streamChat(
        { model: model || 'auto', messages, sessionId },
        (content) => {
          full += content
          const text = full
          setEntries((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last?.role === 'assistant') {
              next[next.length - 1] = { role: 'assistant', content: text }
            } else {
              next.push({ role: 'assistant', content: text })
            }
            return next
          })
        }
      )
      // Extract validated operations for the apply flow.
      const ops: PendingOp[] = []
      for (const block of extractJsonBlocks(full)) {
        if (!block.ok) continue
        const checked = validateAiOperation(block.value)
        if (checked.valid && checked.operation) {
          ops.push({ key: `${Date.now()}-${ops.length}`, operation: checked.operation })
        }
      }
      if (ops.length > 0) setPendingOps((prev) => [...prev, ...ops])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'AI request failed')
    } finally {
      setStreaming(false)
    }
  }

  const applyOp = (pending: PendingOp) => {
    const op = pending.operation
    if (op.action === 'add-component') {
      const component = {
        ...(op.component as unknown as Record<string, unknown>),
        id: freshId('comp'),
      } as unknown as Component
      const result = addComponentToPage(component)
      if (!result.valid) {
        setError('The component failed validation and was not added.')
        return
      }
    } else {
      const page = {
        ...(op.page as unknown as Record<string, unknown>),
        id: freshId('page'),
      } as unknown as Page
      const result = addPage(page)
      if (!result.valid) {
        setError('The page failed validation and was not added.')
        return
      }
    }
    setApplied((prev) => new Set(prev).add(pending.key))
  }

  const handleCreateProject = (result: AiProjectCreationResult) => {
    if (!onCreateProject) return { valid: false }
    return onCreateProject(result)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="AI assistant"
      >
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <h2 className="text-sm font-semibold text-neutral-900">AI assistant</h2>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            aria-label="Model"
            className="max-w-48 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {(models ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
            {models?.length === 0 && <option value="">No models</option>}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as ContextLevel)}
            aria-label="Context level"
            title="How much project context leaves the machine"
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="minimal">Minimal context</option>
            <option value="standard">Standard context</option>
            <option value="full">Full context</option>
          </select>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close" className="ml-auto">
            ✕
          </Button>
        </div>
        {modelsError && (
          <p className="border-b bg-amber-50 px-4 py-1.5 text-xs text-amber-800">{modelsError}</p>
        )}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {creationOpen && onCreateProject ? (
            <AIProjectCreationWizard
              onComplete={handleCreateProject}
              onCancel={() => setCreationOpen(false)}
              initialSessionId={creationSessionId}
              initialState={initialCreationState}
            />
          ) : (
            <>
              {!creationOpen && onCreateProject && (
                <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-3">
                  <p className="text-sm font-medium text-primary-900">Start from a project brief</p>
                  <p className="mt-1 text-xs leading-relaxed text-primary-800">
                    Capture the idea, clarify a few details, and generate a project when you submit.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setCreationOpen(true)}
                  >
                    Create from a brief
                  </Button>
                </div>
              )}
              {entries.length === 0 && (
                <div className="rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-500">
                  <p className="font-medium text-neutral-700">Try asking for a component:</p>
                  <p className="mt-1">“Add a primary button labeled Checkout” — the reply includes an
                  operation you can apply straight to the canvas.</p>
                </div>
              )}
              {entries.map((entry, i) => (
                <div key={i} className={entry.role === 'user' ? 'text-right' : 'text-left'}>
                  <div
                    className={`inline-block max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-sm ${
                      entry.role === 'user' ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    {entry.content}
                  </div>
                </div>
              ))}
              {streaming && entries[entries.length - 1]?.role !== 'assistant' && (
                <p className="text-xs text-neutral-400">Thinking…</p>
              )}
              {pendingOps.length > 0 && (
                <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Suggested changes
                  </h3>
                  {pendingOps.map((pending) => {
                    const done = applied.has(pending.key)
                    const op = pending.operation
                    const summary =
                      op.action === 'add-component'
                        ? `${(op.component as unknown as Record<string, unknown>).type} — ${String((op.component as unknown as Record<string, unknown>).name ?? (op.component as unknown as Record<string, unknown>).id)}`
                        : `${(op.page as unknown as Record<string, unknown>).title ?? (op.page as unknown as Record<string, unknown>).id}`
                    return (
                      <div key={pending.key} className="flex items-center gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate text-neutral-700">{summary}</span>
                        <Button size="sm" variant="outline" disabled={done} onClick={() => applyOp(pending)}>
                          {done ? 'Applied ✓' : 'Apply'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
              {error && <p className="text-xs text-red-600">{error}</p>}
            </>
          )}
        </div>
        {!creationOpen && (
          <div className="flex items-center gap-2 border-t p-3">
            <div className="flex-1">
              <Input
                value={draft}
                placeholder={project ? 'Ask for a component, copy, or fix…' : 'Open a project first'}
                aria-label="Message"
                disabled={!project || streaming}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void send()
                }}
              />
            </div>
            <Button onClick={() => void send()} disabled={!project || streaming || !draft.trim()}>
              {streaming ? '…' : 'Send'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIPanel
