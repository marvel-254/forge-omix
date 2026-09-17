import { useCallback } from 'react'
import { useSchemaStore } from '../store/schemaStore'
import { resolveActivePage } from '../canvas/puckBridge'
import type { Component } from '@client/types/schema'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

/**
 * Context-sensitive panel for the selected component (docs/04 §4.8).
 * Edits props on the active page's component tree; every mutation is
 * validated by the schema store before commit.
 */
export function PropertiesPanel() {
  const project = useSchemaStore((s) => s.project)
  const activePageId = useSchemaStore((s) => s.activePageId)
  const selectedIds = useSchemaStore((s) => s.selectedIds)
  const updateProject = useSchemaStore((s) => s.actions.updateProject)
  const removeComponentFromPage = useSchemaStore((s) => s.actions.removeComponentFromPage)

  const page = resolveActivePage(project, activePageId)
  const selectedId = selectedIds.values().next().value as string | undefined
  const component =
    selectedId && page
      ? page.components.find((c: Component) => c.id === selectedId)
      : undefined

  const patchComponent = useCallback(
    (componentId: string, patch: Partial<Component>) => {
      if (!project || !page) return
      const updated = {
        ...project,
        pages: project.pages.map((p) =>
          p.id === page.id
            ? {
                ...p,
                components: p.components.map((c) =>
                  c.id === componentId ? { ...c, ...patch } : c
                ),
              }
            : p
        ),
        updatedAt: new Date().toISOString(),
      }
      updateProject(updated as unknown as Record<string, unknown>)
    },
    [project, page, updateProject]
  )

  if (!component) {
    return (
      <div className="p-3 text-sm text-neutral-500">
        Select a component on the canvas to edit its properties.
      </div>
    )
  }

  const props = (component.props ?? {}) as Record<string, unknown>

  return (
    <div className="p-3 space-y-4 text-sm">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="inline-block rounded-full bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5">
            {component.type}
          </span>
          <span className="text-xs text-neutral-400 truncate max-w-[120px]">{component.id}</span>
        </div>
        <Input
          label="Name"
          value={component.name ?? ''}
          placeholder={component.type}
          onChange={(e) => patchComponent(component.id, { name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Props</h4>
        <Input
          label="label"
          value={typeof props.label === 'string' ? props.label : ''}
          onChange={(e) =>
            patchComponent(component.id, {
              props: { ...props, label: e.target.value },
            } as Partial<Component>)
          }
        />
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => removeComponentFromPage(component.id)}
      >
        Delete component
      </Button>
    </div>
  )
}

export default PropertiesPanel
