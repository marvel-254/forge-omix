import {
  Component,
  memo,
  useCallback,
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from 'react'
import { useSchemaStore } from '../../store/schemaStore'
import { Input } from '../ui/Input'
import {
  getComponent,
  getComponentCatalog,
  defaultPropsFor,
  type ComponentType,
} from './index'
import { getComponentMeta } from '../../canvas/componentCatalog'

const PREVIEW_ID_PREFIX = 'library-preview-'

/**
 * Contains preview failures to a single card. Some components need real
 * layout APIs a preview tile cannot offer (Chart drives canvas measurement),
 * and one bad preview must never take down the editor.
 */
class PreviewBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error): void {
    console.error('ComponentLibrary preview failed:', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * Preview renders the canvas render function with the component's canonical
 * default props, so a preview can never be handed an incomplete prop set.
 */
function LibraryCardInner({
  type,
  onAdd,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  type: ComponentType
  onAdd: (type: ComponentType) => void
  onDragStart: (e: DragEvent<HTMLElement>, type: ComponentType) => void
  onDragEnd: () => void
  isDragging: boolean
}) {
  const meta = getComponentMeta(type)
  const PreviewComponent = meta.preview === 'glyph' ? undefined : getComponent(type)
  const previewProps = defaultPropsFor(type as Parameters<typeof defaultPropsFor>[0])

  return (
    <button
      type="button"
      data-testid={`library-card-${type}`}
      title={meta.description}
      aria-label={`Add ${meta.label}`}
      draggable
      onClick={() => onAdd(type)}
      onDragStart={(e) => onDragStart(e, type)}
      onDragEnd={onDragEnd}
      className={`group cursor-grab overflow-hidden rounded-lg border bg-card p-2 text-left transition-shadow hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'opacity-50 ring-2 ring-primary-400' : ''
      }`}
    >
      <div className="mb-2 flex h-14 items-center justify-center overflow-hidden rounded bg-background/60">
        <PreviewBoundary fallback={<span className="text-lg text-muted-foreground">{meta.glyph}</span>}>
          {PreviewComponent ? (
            <div className="w-full scale-[0.85] origin-center [&_*]:pointer-events-none">
              <PreviewComponent id={`${PREVIEW_ID_PREFIX}${type}`} puck={{}} {...previewProps} />
            </div>
          ) : (
            <span className="text-lg text-muted-foreground">{meta.glyph}</span>
          )}
        </PreviewBoundary>
      </div>
      <span className="block truncate text-xs font-medium text-foreground">{meta.label}</span>
      <span className="text-[10px] text-muted-foreground">{meta.category}</span>
    </button>
  )
}

/**
 * Memoized: a card renders a full component instance, so re-rendering every
 * card on each keystroke in the search box (or drag-state change) is the
 * difference between a fluid panel and a stuttering one.
 */
const LibraryCard = memo(LibraryCardInner)

export default function ComponentLibrary({
  onSelectComponent,
}: {
  onSelectComponent: (type: ComponentType) => void
}) {
  const draggingType = useSchemaStore((s) => s.draggingLibraryType)
  const setDraggingType = useSchemaStore((s) => s.setDraggingLibraryType)
  const [query, setQuery] = useState('')

  const groups = useMemo(() => getComponentCatalog(), [])

  const searching = query.trim().length > 0
  const results = useMemo(() => {
    if (!searching) return []
    const q = query.trim().toLowerCase()
    return groups
      .flatMap((g) => g.types)
      .filter((type) => {
        const meta = getComponentMeta(type)
        return (
          meta.label.toLowerCase().includes(q) ||
          meta.description.toLowerCase().includes(q) ||
          meta.category.toLowerCase().includes(q)
        )
      })
  }, [searching, query, groups])

  const handleDragStart = useCallback(
    (event: DragEvent<HTMLElement>, type: ComponentType) => {
      event.dataTransfer.effectAllowed = 'copy'
      event.dataTransfer.setData('text/omix-component', type)
      setDraggingType(type)
    },
    [setDraggingType]
  )

  const handleDragEnd = useCallback(() => setDraggingType(null), [setDraggingType])

  const total = useMemo(() => groups.reduce((n, g) => n + g.types.length, 0), [groups])

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Component Library
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {total}
        </span>
      </h2>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search components…"
        aria-label="Search components"
      />
      {searching ? (
        results.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
            No components match “{query.trim()}”.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {results.map((type) => (
              <LibraryCard
                key={type}
                type={type}
                onAdd={onSelectComponent}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggingType === type}
              />
            ))}
          </div>
        )
      ) : (
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section key={group.category}>
              <h3 className="sticky top-0 z-10 mb-2 bg-background/90 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                {group.category}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {group.types.map((type) => (
                  <LibraryCard
                    key={type}
                    type={type}
                    onAdd={onSelectComponent}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingType === type}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}