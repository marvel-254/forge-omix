import { useCallback, useEffect, useRef, useState } from 'react'
import { useSchemaStore } from '../store/schemaStore'

export type CanvasViewport = 'desktop' | 'tablet' | 'mobile'

interface CanvasHooks {
  // Selection management
  selectedIds: Set<string>
  onSelect: (id: string, multi?: boolean) => void
  onDeselectAll: () => void

  // Component positioning
  onComponentMove: (id: string, position: { x: number; y: number }) => void
  onComponentResize: (id: string, size: { width: number; height: number }) => void

  // Viewport management
  viewport: CanvasViewport
  setViewport: (viewport: CanvasViewport) => void

  // Performance monitoring
  fps: number
  lastFrameTime: number
}

/**
 * Canvas interaction hook: selection, positioning, viewport switching,
 * and a lightweight FPS monitor (docs/04 performance model).
 */
export function useCanvas(_viewportWidth: number = 1200): CanvasHooks {
  const updateComponent = useSchemaStore((s) => s.actions.updateComponent)
  const [selectedIds, setSelectedIdsInternal] = useState<Set<string>>(new Set())
  const [viewport, setViewportInternal] = useState<CanvasViewport>('desktop')
  const [fps, setFps] = useState(60)
  const [lastFrameTime, setLastFrameTime] = useState(Date.now())
  const animationFrameRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(Date.now())

  const setSelectedIds = useCallback(
    (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      setSelectedIdsInternal((prev) => (typeof ids === 'function' ? ids(prev) : ids))
    },
    []
  )

  const setViewport = useCallback((newViewport: CanvasViewport) => {
    setViewportInternal(newViewport)
  }, [])

  // Performance monitoring (rAF loop, paused when hidden)
  useEffect(() => {
    let cancelled = false
    const loop = () => {
      if (cancelled) return
      const now = Date.now()
      const delta = now - lastFrameRef.current
      if (delta > 0) {
        const currentFps = Math.round(1000 / delta)
        // Smooth to avoid flicker on one-off long frames
        setFps((prev) => Math.round(prev * 0.9 + currentFps * 0.1))
      }
      lastFrameRef.current = now
      setLastFrameTime(now)
      animationFrameRef.current = requestAnimationFrame(loop)
    }
    animationFrameRef.current = requestAnimationFrame(loop)
    return () => {
      cancelled = true
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Selection management
  const onSelect = useCallback(
    (id: string, multi?: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (multi) {
          if (next.has(id)) next.delete(id)
          else next.add(id)
        } else {
          next.clear()
          next.add(id)
        }
        return next
      })
    },
    [setSelectedIds]
  )

  const onDeselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [setSelectedIds])

  // Component positioning (committed through the validated schema store)
  const onComponentMove = useCallback(
    (id: string, position: { x: number; y: number }) => {
      updateComponent(id, { position })
    },
    [updateComponent]
  )

  const onComponentResize = useCallback(
    (id: string, size: { width: number; height: number }) => {
      updateComponent(id, { size })
    },
    [updateComponent]
  )

  return {
    selectedIds,
    onSelect,
    onDeselectAll,
    viewport,
    setViewport,
    fps,
    lastFrameTime,
    onComponentMove,
    onComponentResize,
  }
}
