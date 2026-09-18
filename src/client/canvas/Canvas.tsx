import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { Puck } from '@measured/puck'
import type { Config, Data, PuckAction, AppState } from '@measured/puck'
import '@measured/puck/dist/index.css'
import { useSchemaStore } from '../store/schemaStore'
import {
  pageToPuckData,
  applyPuckContentToPage,
  resolveActivePage,
} from './puckBridge'
import { canvasRegistry, defaultPropsFor } from './registry'
import { buildTokenCssVars } from './themeVars'
import type { CanvasViewport } from './useCanvas'
import { Button } from '../components/ui/Button'

interface CanvasProps {
  viewport?: CanvasViewport
  /** Called when the user switches viewport from the canvas toolbar. */
  onViewportChange?: (viewport: CanvasViewport) => void
}

/** Viewport widths for responsive simulation (docs/04 §4.5). */
const VIEWPORT_WIDTHS: Record<CanvasViewport, number> = {
  mobile: 480,
  tablet: 768,
  desktop: 1200,
}

const puckConfig: Config = {
  components: canvasRegistry,
}

export function Canvas({ viewport = 'desktop', onViewportChange }: CanvasProps) {
  const project = useSchemaStore((s) => s.project)
  const activePageId = useSchemaStore((s) => s.activePageId)
  const canvasRevision = useSchemaStore((s) => s.canvasRevision)
  const draggingType = useSchemaStore((s) => s.draggingLibraryType)
  const setDraggingType = useSchemaStore((s) => s.setDraggingLibraryType)
  const addComponentToPage = useSchemaStore((s) => s.actions.addComponentToPage)
  const selectComponent = useSchemaStore((s) => s.selectComponent)
  const setSelectedIds = useSchemaStore((s) => s.setSelectedIds)

  // Drop-zone hover state for the drag-from-library affordance.
  const [isDropTarget, setIsDropTarget] = useState(false)

  // Fit-to-width: scale the page to fill the available canvas width.
  // Persisted per project via editorPrefs (project.settings.editor).
  const fitToWidth = useSchemaStore((s) => s.editorPrefs.fitToWidth)
  const setEditorPrefs = useSchemaStore((s) => s.setEditorPrefs)
  const toggleFit = useCallback(
    () => setEditorPrefs({ fitToWidth: !fitToWidth }),
    [setEditorPrefs, fitToWidth]
  )
  const fitFrameRef = useRef<HTMLDivElement>(null)

  const data = useMemo(() => pageToPuckData(project, activePageId), [project, activePageId])
  const page = resolveActivePage(project, activePageId)

  // Theme the canvas from project design tokens: overrides for the shadcn
  // CSS variables on the drop-zone wrapper, injected into Puck's iframe so
  // rendered components inside it retheme too.
  const tokenVars = useMemo(() => buildTokenCssVars(project?.designTokens), [project?.designTokens])
  const tokenStyle = useMemo(
    () => Object.fromEntries(Object.entries(tokenVars).map(([k, v]) => [k, v])) as React.CSSProperties,
    [tokenVars]
  )
  const tokenCssText = useMemo(
    () =>
      Object.entries(tokenVars)
        .map(([k, v]) => `${k}:${v}`)
        .join(';'),
    [tokenVars]
  )
  useEffect(() => {
    // Puck creates its iframe asynchronously after mount, so retry briefly.
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const inject = () => {
      const iframe = fitFrameRef.current?.querySelector('iframe')
      const doc = iframe?.contentDocument
      if (!doc || !doc.head) {
        if (attempts++ < 40) timer = setTimeout(inject, 50)
        return
      }
      let style = doc.getElementById('omix-token-theme')
      if (!style) {
        style = doc.createElement('style')
        style.id = 'omix-token-theme'
        doc.head.appendChild(style)
      }
      style.textContent = tokenCssText ? `:root{${tokenCssText}}` : ''
    }
    inject()
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [tokenCssText, canvasRevision, page.id])

  // NOTE: Puck subscribes to onChange once at mount and keeps calling that
  // first closure forever, so this handler must NOT close over `project` /
  // `activePageId` (they would freeze at remount time and clobber newer
  // store-side edits on merge). Read live state via getState() instead.
  const onChange = useCallback((nextData: Data) => {
    const state = useSchemaStore.getState()
    const current = state.project
    if (!current) return
    const updated = applyPuckContentToPage(current, state.activePageId, nextData.content)
    state.actions.updateProject(updated as unknown as Record<string, unknown>)
  }, [])

  const onAction = useCallback(
    (action: PuckAction, appState: AppState) => {
      void action
      // Mirror Puck's selection into the schema store so side panels can use it.
      const selector = appState.ui.itemSelector
      if (selector) {
        const item = appState.data.content[selector.index]
        const id = item?.props?.id
        if (typeof id === 'string') {
          selectComponent(id)
          return
        }
      }
      setSelectedIds(new Set())
    },
    [selectComponent, setSelectedIds]
  )

  // Zoom-to-fit: while enabled we OWN the transform of Puck's
  // #puck-canvas-root, scaling the page so it fills the frame width exactly
  // (scale = frameWidth / viewportWidth). Puck's own auto-zoom only scales
  // down and re-asserts its transform on re-render, so we re-apply ours via
  // a ResizeObserver (frame resizes) and a MutationObserver (Puck rewrites
  // the style attribute). On disable we restore Puck's auto-zoom, which per
  // its getZoomConfig is min(1, frameWidth / viewportWidth) for height:auto.
  useEffect(() => {
    const frame = fitFrameRef.current
    if (!frame) return

    const viewportWidth = VIEWPORT_WIDTHS[viewport] ?? 1200
    const getRoot = () => frame.querySelector('#puck-canvas-root') as HTMLElement | null
    const getInner = () => getRoot()?.parentElement as HTMLElement | null

    const applyFit = () => {
      const root = getRoot()
      const inner = getInner()
      if (!root || !inner || !root.dataset.omixFit) return
      const innerWidth = inner.clientWidth
      if (innerWidth <= 0) return
      const scale = innerWidth / viewportWidth
      root.style.transformOrigin = 'top left'
      root.style.transform = Math.abs(scale - 1) < 0.001 ? '' : `scale(${scale})`
    }

    const disableFit = () => {
      const root = getRoot()
      if (!root || !root.dataset.omixFit) return
      const inner = getInner()
      const innerWidth = inner?.clientWidth ?? 0
      // Puck's auto-zoom for height:auto viewports: fit-down or 100%.
      const auto = innerWidth > 0 && viewportWidth > innerWidth ? innerWidth / viewportWidth : 1
      root.style.transformOrigin = ''
      root.style.transform = Math.abs(auto - 1) < 0.001 ? '' : `scale(${auto})`
      delete root.dataset.omixFit
    }

    if (fitToWidth) {
      const root = getRoot()
      if (root) root.dataset.omixFit = 'on'
      applyFit()

      const resizeObserver = new ResizeObserver(applyFit)
      const inner = getInner()
      if (inner) resizeObserver.observe(inner)
      resizeObserver.observe(frame)

      // Puck rewrites the style attribute when its zoom state changes —
      // re-assert our fit scale so our override always wins while enabled.
      const mutationObserver = new MutationObserver(applyFit)
      const rootEl = getRoot()
      if (rootEl) {
        mutationObserver.observe(rootEl, { attributes: true, attributeFilter: ['style'] })
      }

      return () => {
        resizeObserver.disconnect()
        mutationObserver.disconnect()
        disableFit()
      }
    }

    disableFit()
  }, [fitToWidth, viewport, canvasRevision])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      // Read the drag payload BEFORE clearing: zustand set() is synchronous,
      // so reading draggingLibraryType after setDraggingType(null) would
      // always fall through to dataTransfer (which some browsers don't
      // propagate). The store is the source of truth, dataTransfer the fallback.
      const type =
        useSchemaStore.getState().draggingLibraryType ??
        event.dataTransfer.getData('text/omix-component')
      setIsDropTarget(false)
      setDraggingType(null)
      if (!type || !(type in canvasRegistry)) return
      const component = {
        id: 'comp_' + Math.random().toString(36).slice(2, 10),
        type,
        props: defaultPropsFor(type),
      } as unknown as Parameters<typeof addComponentToPage>[0]
      addComponentToPage(component)
    },
    [addComponentToPage, setDraggingType]
  )

  if (!project || !page) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-50">
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-medium text-neutral-600">No page open</p>
          <p className="mt-1 text-xs text-neutral-400">Create a project to start editing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-white">
        <span className="text-xs font-medium text-neutral-500 mr-2">Viewport</span>
        {(Object.keys(VIEWPORT_WIDTHS) as CanvasViewport[]).map((vp) => (
          <Button
            key={vp}
            size="sm"
            variant={vp === viewport ? 'default' : 'outline'}
            aria-pressed={vp === viewport}
            onClick={() => onViewportChange?.(vp)}
          >
            {vp}
          </Button>
        ))}
        <span className="ml-auto text-xs text-neutral-400">
          {VIEWPORT_WIDTHS[viewport] ?? 1200}px
        </span>
        <Button
          size="sm"
          variant={fitToWidth ? 'default' : 'outline'}
          aria-pressed={fitToWidth}
          title="Scale the page to fill the available canvas width"
          onClick={toggleFit}
        >
          Fit
        </Button>
      </div>
      <div
        ref={fitFrameRef}
        style={tokenStyle}
        className={`relative flex-1 min-h-0 ${
          isDropTarget ? 'ring-2 ring-inset ring-primary-400' : ''
        }`}
        onDragOver={(event) => {
          if (!draggingType) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
          setIsDropTarget(true)
        }}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setIsDropTarget(false)
        }}
        onDrop={handleDrop}
      >
        {/* Remount Puck on page switch / structural revision / viewport change
            so its internal history, selection, and iframe width reset together
            (Puck reads `data` and `ui` only on mount). */}
        <Puck
          key={`${page.id}-${canvasRevision}-${viewport}`}
          config={puckConfig}
          data={data}
          onChange={onChange}
          onAction={onAction}
          viewports={[
            {
              width: VIEWPORT_WIDTHS[viewport],
              label: viewport,
            },
          ]}
        />
        {isDropTarget && (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-primary-50/40">
            <span className="rounded-md border border-primary-300 bg-white px-3 py-1.5 text-sm font-medium text-primary-700 shadow-sm">
              Drop {draggingType ?? 'component'} to add it to the page
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Canvas
