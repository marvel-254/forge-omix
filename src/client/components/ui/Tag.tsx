import { cn } from '@client/lib/utils'

interface TagProps {
  label: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  removable?: boolean
  onRemove?: () => void
  className?: string
}

const variantStyles = {
  default: 'bg-neutral-100 text-neutral-900 border border-neutral-200',
  primary: 'bg-blue-100 text-blue-900 border border-blue-200',
  success: 'bg-green-100 text-green-900 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-900 border border-yellow-200',
  danger: 'bg-red-100 text-red-900 border border-red-200',
}

export function Tag({
  label,
  variant = 'default',
  removable = false,
  onRemove,
  className,
}: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {label}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-70 transition-opacity"
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </span>
  )
}
