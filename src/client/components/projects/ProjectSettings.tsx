import { useState } from 'react'
import { useSchemaStore } from '../../store/schemaStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

/**
 * Project settings modal (Phase 7 project system): edit name, description,
 * and version. Commits through the validated store; invalid values
 * (empty name, non-semver version) are rejected with an inline error.
 */
export function ProjectSettings({ onClose }: { onClose: () => void }) {
  const project = useSchemaStore((s) => s.project)
  const updateProject = useSchemaStore((s) => s.actions.updateProject)

  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(
    typeof project?.description === 'string' ? project.description : ''
  )
  const [version, setVersion] = useState(project?.version ?? '1.0.0')
  const [error, setError] = useState<string | null>(null)

  if (!project) return null

  const handleSave = () => {
    const result = updateProject({
      name: name.trim(),
      description: description.trim() ? description.trim() : undefined,
      version: version.trim(),
    } as unknown as Record<string, unknown>)
    if (!result.valid) {
      setError('Could not save: name is required and version must look like 1.2.3')
      return
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Project settings"
      >
        <h2 className="mb-4 text-base font-semibold tracking-tight text-neutral-900">
          Project settings
        </h2>
        <div className="space-y-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Description"
            value={description}
            placeholder="What is this project about?"
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label="Version"
            value={version}
            placeholder="1.0.0"
            onChange={(e) => setVersion(e.target.value)}
          />
          <div className="rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
            <p>
              ID: <span className="font-mono">{project.id}</span>
            </p>
            <p className="mt-0.5">
              {project.pages.length} page{project.pages.length === 1 ? '' : 's'} · updated{' '}
              {typeof project.updatedAt === 'string' ? project.updatedAt : '—'}
            </p>
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save settings
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProjectSettings
