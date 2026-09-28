import { useCallback, useEffect, useState } from 'react'
import { projectsApi, type ProjectRow } from '@client/lib/api'
import { Button } from '../ui/Button'

/**
 * Project browser (Phase 7 project system): lists server-side projects with
 * open/delete actions. Shown on the onboarding screen; when the API is
 * unreachable it degrades to a notice (local-first fallback).
 */
export function ProjectBrowser({ onOpen }: { onOpen: (id: string) => void }) {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setProjects(await projectsApi.list())
      setError(null)
    } catch {
      setProjects(null)
      setError('Server unreachable — projects list unavailable.')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!window.confirm(`Delete project "${name}"? This cannot be undone.`)) return
      setBusyId(id)
      try {
        await projectsApi.remove(id)
        await refresh()
      } catch {
        setError('Delete failed — the server may be unreachable.')
      } finally {
        setBusyId(null)
      }
    },
    [refresh]
  )

  if (error && projects === null) {
    return <p className="mt-1 text-xs text-neutral-400">{error}</p>
  }

  if (projects === null) {
    return <p className="mt-1 text-xs text-neutral-400">Loading projects…</p>
  }

  if (projects.length === 0) {
    return (
      <div className="mt-1 flex items-center gap-2">
        <p className="text-xs text-neutral-400">No saved projects yet.</p>
        <Button size="sm" variant="ghost" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-1 text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Your projects
        </h2>
        <Button size="sm" variant="ghost" onClick={() => void refresh()} aria-label="Refresh projects">
          Refresh
        </Button>
      </div>
      <ul className="max-h-44 space-y-1 overflow-y-auto">
        {projects.map((project) => (
          <li
            key={project.id}
            className="group flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-neutral-50"
          >
            <button
              type="button"
              onClick={() => onOpen(project.id)}
              className="min-w-0 flex-1 px-2 py-1 text-left"
              title={`Open ${project.name} (${project.id})`}
            >
              <span className="block truncate text-sm font-medium text-neutral-800">
                {project.name}
              </span>
              <span className="block truncate text-xs text-neutral-400">
                {project.id} · v{project.version}
              </span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Delete project ${project.name}`}
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              disabled={busyId === project.id}
              onClick={() => void handleDelete(project.id, project.name)}
            >
              ✕
            </Button>
          </li>
        ))}
      </ul>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default ProjectBrowser
