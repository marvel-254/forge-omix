import React, { useState, useRef, useCallback, useEffect } from 'react'

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

interface SelectionRect {
  left: number
  top: number
  width: number
  height: number
}

interface SelectionOverlayProps {
  rect: SelectionRect
  scale: number
  onResize: (newRect: SelectionRect) => void
}

/**
 * Selection overlay with corner resize handles.
 * Renders above the selected canvas element; pointer events only on handles.
 */
export function SelectionOverlay({ rect, scale, onResize }: SelectionOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null)

  const handleMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeHandle(handle)
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizeHandle) return

      const deltaX = e.movementX
      const deltaY = e.movementY

      let { left, top, width, height } = rect

      switch (resizeHandle) {
        case 'nw':
          left += deltaX
          top += deltaY
          width -= deltaX
          height -= deltaY
          break
        case 'ne':
          top += deltaY
          width += deltaX
          height -= deltaY
          break
        case 'sw':
          left += deltaX
          width -= deltaX
          height += deltaY
          break
        case 'se':
          width += deltaX
          height += deltaY
          break
      }

      // Prevent negative sizes
      width = Math.max(8, width)
      height = Math.max(8, height)

      onResize({ left, top, width, height })
    },
    [resizeHandle, rect, onResize]
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    setResizeHandle(null)
  }, [])

  useEffect(() => {
    if (!isResizing) return
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={overlayRef}
      className="absolute pointer-events-none border-2 border-primary-500"
      style={{
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        transform: `scale(${1 / scale})`,
        transformOrigin: 'top left',
        zIndex: 1001,
      }}
    >
      {(['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((handle) => (
        <div
          key={handle}
          className="absolute w-3 h-3 bg-primary-500 rounded-full pointer-events-auto cursor-nwse-resize"
          style={{
            left: handle.includes('w') ? '-6px' : 'calc(100% - 6px)',
            top: handle.includes('n') ? '-6px' : 'calc(100% - 6px)',
            transform: `translate(${handle.includes('w') ? '-50%' : '50%'}, ${
              handle.includes('n') ? '-50%' : '50%'
            })`,
          }}
          onMouseDown={(e) => handleMouseDown(e, handle)}
        />
      ))}
    </div>
  )
}

export default SelectionOverlay
