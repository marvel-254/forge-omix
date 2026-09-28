import { useCallback, useEffect, useRef, useState } from 'react'
import { useSchemaStore } from '../store/schemaStore'

/** Viewport widths for responsive simulation (docs/04 §4.5). */
export type CanvasViewport = 'mobile' | 'tablet' | 'desktop'

export const VIEWPORT_WIDTHS: Record<CanvasViewport, number> = {
  mobile: 480,
  tablet: 768,
  desktop: 1200,
}

/** Schema component type (from universal schema). */
export type SchemaComponent = {
  id: string
  type: string
  name?: string
  props: Record<string, unknown>
  children?: SchemaComponent[]
  styles?: Record<string, unknown>
  interactions?: Record<string, unknown>
  responsive?: Array<{
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    props?: Record<string, unknown>
    styles?: Record<string, unknown>
    hidden?: boolean
  }>
  accessibility?: Record<string, unknown>
  version?: string
}

/** Hook for canvas viewport management. */
export function useCanvas() {
  const project = useSchemaStore((s) => s.project)
  const activePageId = useSchemaStore((s) => s.activePageId)
  const canvasRevision = useSchemaStore((s) => s.canvasRevision)
  const draggingType = useSchemaStore((s) => s.draggingLibraryType)
  const setDraggingType = useSchemaStore((s) => s.setDraggingLibraryType)
  const addComponentToPage = useSchemaStore((s) => s.actions.addComponentToPage)
  const selectComponent = useSchemaStore((s) => s.selectComponent)
  const setSelectedIds = useSchemaStore((s) => s.setSelectedIds)
  const editorPrefs = useSchemaStore((s) => s.editorPrefs)
  const setEditorPrefs = useSchemaStore((s) => s.setEditorPrefs)

  const [viewport, setViewport] = useState<CanvasViewport>('desktop')
  const [isDropTarget, setIsDropTarget] = useState(false)
  const [fitToWidth, setFitToWidth] = useState(editorPrefs?.fitToWidth ?? false)
  const fitFrameRef = useRef<HTMLDivElement>(null)

  const toggleFit = useCallback(() => {
    const next = !fitToWidth
    setFitToWidth(next)
    setEditorPrefs({ fitToWidth: next })
  }, [fitToWidth, setEditorPrefs])

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const type =
        useSchemaStore.getState().draggingLibraryType ??
        event.dataTransfer.getData('text/omix-component')
      setIsDropTarget(false)
      setDraggingType(null)
      if (!type || !canvasRegistry[type]) return
      const component = {
        id: 'comp_' + Math.random().toString(36).slice(2, 10),
        type,
        props: defaultPropsFor(type),
      } as unknown as Parameters<typeof addComponentToPage>[0]
      addComponentToPage(component)
    },
    [addComponentToPage, setDraggingType]
  )

  const onViewportChange = useCallback((vp: CanvasViewport) => {
    setViewport(vp)
  }, [])

  return {
    project,
    activePageId,
    canvasRevision,
    draggingType,
    setDraggingType,
    addComponentToPage,
    selectComponent,
    setSelectedIds,
    viewport,
    setViewport: onViewportChange,
    isDropTarget,
    setIsDropTarget,
    fitToWidth,
    setFitToWidth: toggleFit,
    fitFrameRef,
    handleDrop,
  }
}

// These need to be imported from registry - re-export for convenience
import { canvasRegistry, defaultPropsFor } from '../canvas/registry'

/** Hook for breakpoint/responsive management. */
export function useBreakpoints() {
  const [breakpoint, setBreakpoint] = useState<CanvasViewport>('desktop')

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth
      if (width < 640) setBreakpoint('mobile')
      else if (width < 1024) setBreakpoint('tablet')
      else setBreakpoint('desktop')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const applyBreakpoint = useCallback((styles: Record<string, unknown>) => {
    // Placeholder for applying breakpoint-specific styles
    return styles
  }, [])

  return { breakpoint, applyBreakpoint }
}

/** Hook for search functionality. */
export function useSearch<T>(items: T[], searchFn: (item: T, query: string) => boolean) {
  const [query, setQuery] = useState('')
  const filtered = items.filter((item) => searchFn(item, query))
  return { query, setQuery, filtered }
}