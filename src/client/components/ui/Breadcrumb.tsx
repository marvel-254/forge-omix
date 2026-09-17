import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface BreadcrumbItem {
  label: ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: ReactNode
  className?: string
}

export function Breadcrumb({
  items,
  separator = '/',
  className,
}: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-neutral-400">{separator}</span>}
          {item.href || item.onClick ? (
            <a
              href={item.href}
              onClick={(e) => {
                if (item.onClick) {
                  e.preventDefault()
                  item.onClick()
                }
              }}
              className={cn(
                'hover:text-blue-600 transition-colors',
                item.active ? 'text-neutral-900 font-medium' : 'text-neutral-600'
              )}
            >
              {item.label}
            </a>
          ) : (
            <span
              className={cn(
                item.active ? 'text-neutral-900 font-medium' : 'text-neutral-600'
              )}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
