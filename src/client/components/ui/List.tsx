import { cn } from '@client/lib/utils'

interface ListProps {
  items: Array<{
    label: React.ReactNode
    value: React.ReactNode
    icon?: React.ReactNode
    onClick?: () => void
  }>
  className?: string
}

export function List({ items, className }: ListProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          onClick={item.onClick}
          className={cn(
            'flex items-center justify-between px-4 py-3 rounded-lg hover:bg-neutral-50 transition-colors',
            item.onClick && 'cursor-pointer'
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon && <span>{item.icon}</span>}
            <span className="text-sm text-neutral-700">{item.label}</span>
          </div>
          <span className="text-sm text-neutral-500">{item.value}</span>
        </div>
      ))}
    </div>
  )
}