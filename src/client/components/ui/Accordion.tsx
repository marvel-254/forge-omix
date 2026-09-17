import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface AccordionItem {
  value: string
  title: ReactNode
  content: ReactNode
  disabled?: boolean
}

interface AccordionProps {
  items: AccordionItem[]
  defaultValue?: string
  multiple?: boolean
  onChange?: (value: string | string[]) => void
  className?: string
}

export function Accordion({
  items,
  defaultValue,
  multiple = false,
  onChange,
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(
    defaultValue ? new Set([defaultValue]) : new Set()
  )

  const toggleItem = (value: string) => {
    const newOpen = new Set(openItems)
    if (newOpen.has(value)) {
      newOpen.delete(value)
    } else {
      if (!multiple) {
        newOpen.clear()
      }
      newOpen.add(value)
    }
    setOpenItems(newOpen)
    onChange?.(multiple ? Array.from(newOpen) : Array.from(newOpen)[0] ?? '')
  }

  return (
    <div className={cn('border border-neutral-200 rounded-lg overflow-hidden', className)}>
      {items.map((item) => (
        <div key={item.value} className="border-b border-neutral-200 last:border-b-0">
          <button
            onClick={() => !item.disabled && toggleItem(item.value)}
            disabled={item.disabled}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 font-medium text-neutral-900 hover:bg-neutral-50 transition-colors',
              item.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span>{item.title}</span>
            <span className={cn(
              'transition-transform text-neutral-500',
              openItems.has(item.value) ? 'rotate-180' : ''
            )}>
              ▼
            </span>
          </button>
          {openItems.has(item.value) && (
            <div className="px-4 py-3 bg-neutral-50 text-neutral-700 text-sm">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

import * as React from 'react'