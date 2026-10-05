import { useMemo, useState } from 'react'
import { generateProject, slugify, type GeneratedFile } from '../../../lib/codegen'
import {
  ASSET_DIR,
  assetUrl,
  collectMediaUrls,
  rewriteMediaUrls,
  storedNameOf,
} from '../../../lib/codegen/mediaAssets'
import { generateTasks } from '../../../lib/agent'
import type { Project } from '@client/types/schema'
import { Button } from '../ui/Button'

/**
 * Generated-code preview (docs/07 §7.1): file tree, source viewer,
 * copy-to-clipboard, and ZIP download of the React + Vite project
 * emitted from the current schema.
 */
export function CodeModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const files = useMemo(
    () => generateProject(project as unknown as Parameters<typeof generateProject>[0]),
    [project]
  )
  const tasks = useMemo(
    () => generateTasks(project as unknown as Parameters<typeof generateTasks>[0]),
    [project]
  )
  const [tab, setTab] = useState<'files' | 'tasks'>('files')
  const [selectedPath, setSelectedPath] = useState<string>('src/App.tsx')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const selected: GeneratedFile | undefined =
    files.find((f) => f.path === selectedPath) ?? files[0]
  const slug = slugify(project.name ?? 'omix-app')

  const handleCopy = async () => {
    if (!selected) return
    try {
      await navigator.clipboard.writeText(selected.content ?? '')
      setStatus(`Copied ${selected.path}`)
    } catch {
      setStatus('Copy failed — select the text manually')
    }
  }

  const handleDownload = async () => {
    setBusy(true)
    setStatus(null)
    try {
      // Loaded on demand so the editor bundle stays lean.
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()

      // Pull uploaded-asset bytes down first, then rewrite the markup to
      // bundled `public/assets/` copies. Rewriting before the fetch would
      // leave a dangling `/assets/...` reference whenever a download fails,
      // so only assets that actually landed get rewritten.
      const wanted = collectMediaUrls(project)
      const fetched = new Map<string, Uint8Array>()
      await Promise.all(
        wanted.map(async (url) => {
          const storedName = storedNameOf(url)
          if (!storedName) return
          try {
            const response = await fetch(url)
            if (!response.ok) return
            fetched.set(storedName, new Uint8Array(await response.arrayBuffer()))
          } catch {
            // Offline or server error: leave the reference as the original URL.
          }
        })
      )

      const rewritten = rewriteMediaUrls(project, (storedName) =>
        fetched.has(storedName) ? assetUrl(`${ASSET_DIR}/${storedName}`) : null
      )
      const bundled = generateProject(
        rewritten.project as unknown as Parameters<typeof generateProject>[0]
      )
      for (const file of bundled) {
        zip.file(`${slug}/${file.path}`, file.bytes ?? file.content ?? '')
      }
      for (const [storedName, bytes] of fetched) {
        zip.file(`${slug}/${ASSET_DIR}/${storedName}`, bytes)
      }
      const missing = wanted.length - fetched.size

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${slug}.zip`
      anchor.click()
      URL.revokeObjectURL(url)
      const total = bundled.length + fetched.size
      setStatus(
        missing > 0
          ? `Downloaded ${slug}.zip (${total} files) — ${missing} media file(s) unreachable`
          : `Downloaded ${slug}.zip (${total} files)`
      )
    } catch {
      setStatus('ZIP download failed — jszip could not be loaded')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Generated code"
      >
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <h2 className="text-sm font-semibold text-foreground">
            Generated code — {slug} ({files.length} files)
          </h2>
          <div className="flex rounded-md border border-border p-0.5" role="tablist" aria-label="Code or tasks">
            {(['files', 'tasks'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  tab === t ? 'bg-neutral-900 text-white' : 'text-muted-foreground hover:text-neutral-800'
                }`}
              >
                {t === 'files' ? 'Files' : `Tasks (${tasks.length})`}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {status && <span className="text-xs text-muted-foreground">{status}</span>}
            <Button size="sm" variant="outline" onClick={handleCopy}>
              Copy file
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={busy}>
              {busy ? 'Zipping…' : 'Download ZIP'}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close">
              ✕
            </Button>
          </div>
        </div>
        {tab === 'tasks' ? (
          <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-4">
            {tasks.map((task, index) => (
              <li key={task.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{index + 1}.</span>
                  <span className="text-sm font-medium text-foreground">{task.title}</span>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                      task.priority === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : task.priority === 'medium'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-accent text-muted-foreground'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {task.id}
                  {task.dependencies.length > 0
                    ? ` · depends on ${task.dependencies.join(', ')}`
                    : ' · no dependencies'}
                  {` · ~${task.estimatedTokens.total.toLocaleString()} tokens`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
        <div className="flex min-h-0 flex-1">
          <ul className="w-60 shrink-0 overflow-y-auto border-r bg-muted p-2 text-xs">
            {files.map((file) => (
              <li key={file.path}>
                <button
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                  aria-pressed={file.path === selected?.path}
                  className={`w-full truncate rounded px-2 py-1.5 text-left font-mono transition-colors ${
                    file.path === selected?.path
                      ? 'bg-primary-100 font-medium text-primary-900'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {file.path}
                </button>
              </li>
            ))}
          </ul>
          <pre className="min-w-0 flex-1 overflow-auto bg-neutral-950 p-4 font-mono text-xs leading-relaxed text-neutral-100">
            {selected?.content ?? ''}
          </pre>
        </div>
        )}
      </div>
    </div>
  )
}

export default CodeModal
