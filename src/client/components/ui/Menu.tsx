import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface MenuProps {
  items: MenuItem[]
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

interface MenuItem {
  label: ReactNode
  onClick?: () => void
  icon?: ReactNode
  active?: boolean
  disabled?: boolean
  submenu?: MenuItem[]
}

export function Menu({
  items,
  orientation = 'vertical',
  className,
}: MenuProps) {
  const isHorizontal = orientation === 'horizontal'

  return (
    <nav
      className={cn(
        'flex',
        isHorizontal ? 'flex-row gap-1' : 'flex-col',
        className
      )}
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={item.onClick}
          disabled={item.disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors',
            item.active
              ? 'bg-blue-600 text-white'
              : 'text-neutral-700 hover:bg-neutral-100',
            item.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {item.icon && <span>{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </nav>
  )
}
