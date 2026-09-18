import { useState, type DragEvent } from 'react'
import { useSchemaStore } from '../store/schemaStore'
import { resolveActivePage } from '../canvas/puckBridge'
import type { Component } from '@client/types/schema'
import { Button } from '../components/ui/Button'

/**
 * Layers panel: ordered list of the active page's components (docs/04 §4.9).
 * Click to select (syncs with the canvas selection), drag or use the
 * up/down buttons to reorder, delete to remove.
 */
export function LayersPanel() {
  const project = useSchemaStore((s) => s.project)
  const activePageId = useSchemaStore((s) => s.activePageId)
  const selectedIds = useSchemaStore((s) => s.selectedIds)
  const selectComponent = useSchemaStore((s) => s.selectComponent)
  const removeComponentFromPage = useSchemaStore((s) => s.actions.removeComponentFromPage)
  const moveComponentInPage = useSchemaStore((s) => s.actions.moveComponentInPage)

  // Local drag state: which id we're dragging and which index is the drop slot.
  const [dragId, setDragId] = useState<string | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const page = resolveActivePage(project, activePageId)
  const components = (page?.components ?? []) as Component[]

  const commitMove = (id: string, toIndex: number) => {
    setDragId(null)
    setOverIndex(null)
    moveComponentInPage(id, toIndex)
  }

  const handleDrop = (event: DragEvent, index: number) => {
    event.preventDefault()
    event.stopPropagation()
    const id = dragId ?? event.dataTransfer.getData('text/omix-layer')
    if (!id) return
    commitMove(id, index)
  }

  if (components.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-10 text-center">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-base text-neutral-400">
          ▤
        </div>
        <p className="text-sm font-medium text-neutral-600">Page is empty</p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-400">
          Add components from the library to start building.
        </p>
      </div>
    )
  }

  return (
    <ul className="p-2 space-y-1 text-sm">
      {components.map((component, index) => {
        const isSelected = selectedIds.has(component.id)
        const isDragged = dragId === component.id
        const isDropSlot = overIndex === index && dragId !== component.id
        return (
          <li
            key={component.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/omix-layer', component.id)
              setDragId(component.id)
            }}
            onDragEnd={() => {
              setDragId(null)
              setOverIndex(null)
            }}
            onDragOver={(event) => {
              if (!dragId) return
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              setOverIndex(index)
            }}
            onDrop={(event) => handleDrop(event, index)}
            className={`group flex items-center gap-1 rounded transition-opacity ${
              isDragged ? 'opacity-40' : ''
            } ${isDropSlot ? 'ring-2 ring-primary-400' : ''}`}
          >
            <button
              type="button"
              onClick={() => selectComponent(component.id)}
              aria-pressed={isSelected}
              className={`flex-1 text-left px-2 py-1.5 rounded transition-colors cursor-grab active:cursor-grabbing ${
                isSelected
                  ? 'bg-primary-100 text-primary-900 font-medium'
                  : 'hover:bg-neutral-100 text-neutral-700'
              }`}
            >
              <span className="text-neutral-400 mr-2 select-none">
                {isDropSlot ? '⤓' : `${index + 1}.`}
              </span>
              {component.name || component.type}
            </button>
            <span className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Move ${component.name || component.type} up`}
                disabled={index === 0}
                onClick={() => commitMove(component.id, index - 1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Move ${component.name || component.type} down`}
                disabled={index === components.length - 1}
                onClick={() => commitMove(component.id, index + 1)}
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete ${component.name || component.type}`}
                onClick={() => removeComponentFromPage(component.id)}
              >
                ✕
              </Button>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default LayersPanel
