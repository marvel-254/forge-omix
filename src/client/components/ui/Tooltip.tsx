import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
  className?: string
}

const positionStyles = {
  top: 'bottom-full mb-2',
  bottom: 'top-full mt-2',
  left: 'right-full mr-2',
  right: 'left-full ml-2',
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const timeoutRef = React.useRef<number>()

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-neutral-900 rounded whitespace-nowrap',
            positionStyles[position],
            className
          )}
        >
          {content}
          <div
            className={cn(
              'absolute w-2 h-2 bg-neutral-900 rotate-45',
              position === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1',
              position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1',
              position === 'left' && 'left-full top-1/2 -translate-y-1/2 translate-x-1',
              position === 'right' && 'right-full top-1/2 -translate-y-1/2 -translate-x-1'
            )}
          />
        </div>
      )}
    </div>
  )
}

import * as React from 'react'
