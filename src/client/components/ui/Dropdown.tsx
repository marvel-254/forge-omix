import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface DropdownItem {
  label: ReactNode
  value: string
  icon?: ReactNode
  divider?: boolean
  disabled?: boolean
}

interface DropdownProps {
  items: DropdownItem[]
  trigger: ReactNode
  onSelect?: (value: string) => void
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({
  items,
  trigger,
  onSelect,
  align = 'left',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center"
      >
        {trigger}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              'absolute z-50 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {items.map((item, idx) =>
              item.divider ? (
                <div key={idx} className="h-px bg-neutral-200" />
              ) : (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect?.(item.value)
                    setIsOpen(false)
                  }}
                  disabled={item.disabled}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-neutral-100 transition-colors',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}

import * as React from 'react'
