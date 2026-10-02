import { useCallback, useEffect, useState } from 'react'
import { gitApi, ApiError, type GitLogEntry, type GitStatus } from '@client/lib/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

/**
 * Git workspace modal (Phase 10): status, stage-all commit, branches,
 * recent log, per-file diff viewer, push/pull, and changed-since-ref
 * detection for agent sync-back (docs/08 §8.4).
 *
 * Operates on server-side workspace directories (the API sandbox confines
 * all paths to its workspace root).
 */
export function GitModal({ onClose }: { onClose: () => void }) {
  const [dir, setDir] = useState('site')
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [log, setLog] = useState<GitLogEntry[]>([])
  const [branches, setBranches] = useState<{ current: string; all: string[] } | null>(null)
  const [message, setMessage] = useState('')
  const [newBranch, setNewBranch] = useState('')
  const [ref, setRef] = useState('')
  const [changedFiles, setChangedFiles] = useState<string[] | null>(null)
  const [diffFile, setDiffFile] = useState<string | null>(null)
  const [diffText, setDiffText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const fail = (e: unknown, fallback: string) => {
    setError(e instanceof ApiError ? e.message : fallback)
  }

  const refresh = useCallback(async () => {
    const workspace = dir.trim()
    if (!workspace) return
    setBusy(true)
    setError(null)
    try {
      const [s, l, b] = await Promise.all([
        gitApi.status(workspace),
        gitApi.log(workspace).catch(() => [] as GitLogEntry[]),
        gitApi.branches(workspace).catch(() => null),
      ])
      setStatus(s)
      setLog(l)
      setBranches(b)
      setChangedFiles(null)
      setDiffFile(null)
      setDiffText('')
    } catch (e) {
      setStatus(null)
      fail(e, 'Could not load workspace status')
    } finally {
      setBusy(false)
    }
  }, [dir])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const run = useCallback(
    async (fn: () => Promise<unknown>, after = true) => {
      setBusy(true)
      setError(null)
      try {
        await fn()
        if (after) await refresh()
      } catch (e) {
        fail(e, 'Git operation failed')
      } finally {
        setBusy(false)
      }
    },
    [refresh]
  )

  const openDiff = useCallback(
    async (file: string) => {
      setDiffFile(file)
      setDiffText('')
      setError(null)
      try {
        const result = await gitApi.diff(dir.trim(), file)
        setDiffText(result.diff || '(no differences)')
      } catch (e) {
        fail(e, 'Could not load diff')
      }
    },
    [dir]
  )

  const changed = [...(status?.staged ?? []), ...(status?.modified ?? []), ...(status?.untracked ?? [])]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Git workspaces"
      >
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <h2 className="text-sm font-semibold text-foreground">Git</h2>
          <Input
            value={dir}
            onChange={(e) => setDir(e.target.value)}
            placeholder="workspace directory"
            aria-label="Workspace directory"
            className="max-w-52"
          />
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void run(() => gitApi.init(dir.trim()))}
              disabled={busy || !dir.trim()}
              title="Initialize a git repo in this workspace directory"
            >
              Init
            </Button>
            <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={busy}>
              Refresh
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close">
              ✕
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-sm">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {status ? (
            <>
              <section aria-label="Status">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-accent px-2 py-0.5 font-mono">
                    {status.branch || '(no branch)'}
                  </span>
                  {status.ahead > 0 && <span>↑{status.ahead} ahead</span>}
                  {status.behind > 0 && <span>↓{status.behind} behind</span>}
                  <span className={status.clean ? 'text-emerald-600' : 'text-amber-600'}>
                    {status.clean ? 'clean' : `${changed.length} changed file${changed.length === 1 ? '' : 's'}`}
                  </span>
                </div>
                {changed.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {changed.map((file) => (
                      <li key={file}>
                        <button
                          type="button"
                          onClick={() => void openDiff(file)}
                          className="w-full truncate rounded px-2 py-1 text-left font-mono text-xs text-foreground/80 hover:bg-accent"
                        >
                          {file}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section aria-label="Commit" className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Commit message"
                    value={message}
                    placeholder="feat: describe the change"
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  disabled={busy || !message.trim()}
                  onClick={() =>
                    void run(async () => {
                      await gitApi.commit(dir.trim(), message.trim())
                      setMessage('')
                    })
                  }
                >
                  Commit all
                </Button>
              </section>
              <section aria-label="Sync" className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void run(() => gitApi.pull(dir.trim()))}
                >
                  Pull
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void run(() => gitApi.push(dir.trim()))}
                >
                  Push
                </Button>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={ref}
                    placeholder="Compare since ref (commit hash)"
                    aria-label="Compare since ref"
                    onChange={(e) => setRef(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || !ref.trim()}
                    onClick={() =>
                      void run(async () => {
                        const result = await gitApi.changedSince(dir.trim(), ref.trim())
                        setChangedFiles(result.files)
                      }, false)
                    }
                  >
                    Changed
                  </Button>
                </div>
              </section>
              {changedFiles !== null && (
                <p className="text-xs text-muted-foreground">
                  {changedFiles.length === 0
                    ? 'No files changed since that ref.'
                    : `Changed: ${changedFiles.join(', ')}`}
                </p>
              )}
              <section aria-label="Branches" className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Branches: {(branches?.all ?? []).join(', ') || '—'}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={newBranch}
                    placeholder="New or existing branch"
                    aria-label="Branch name"
                    onChange={(e) => setNewBranch(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || !newBranch.trim()}
                    onClick={() =>
                      void run(() => gitApi.checkout(dir.trim(), newBranch.trim()))
                    }
                  >
                    Switch
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || !newBranch.trim()}
                    onClick={() =>
                      void run(() => gitApi.checkout(dir.trim(), newBranch.trim(), true))
                    }
                  >
                    New
                  </Button>
                </div>
              </section>
              {diffFile && (
                <section aria-label="Diff">
                  <h3 className="mb-1 font-mono text-xs text-muted-foreground">{diffFile}</h3>
                  <pre className="max-h-64 overflow-auto rounded-md bg-neutral-950 p-3 font-mono text-xs leading-relaxed text-neutral-100">
                    {diffText || 'Loading…'}
                  </pre>
                </section>
              )}
              <section aria-label="History">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent commits
                </h3>
                {log.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No commits yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {log.slice(0, 10).map((entry) => (
                      <li key={entry.hash} className="text-xs">
                        <span className="font-mono text-muted-foreground">{entry.hash.slice(0, 7)}</span>{' '}
                        <span className="text-foreground/80">{entry.message}</span>{' '}
                        <span className="text-muted-foreground">
                          {entry.author} · {entry.date}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            !error && <p className="text-xs text-muted-foreground">Loading…</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default GitModal
