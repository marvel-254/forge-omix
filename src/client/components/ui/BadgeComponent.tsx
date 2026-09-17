import { cn } from '@client/lib/utils'

interface BadgeProps {
  label: string
  icon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variantStyles = {
  default: 'bg-neutral-100 text-neutral-900 border border-neutral-200',
  primary: 'bg-blue-100 text-blue-900 border border-blue-200',
  success: 'bg-green-100 text-green-900 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-900 border border-yellow-200',
  danger: 'bg-red-100 text-red-900 border border-red-200',
  outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
}

const sizeVariants = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export function BadgeComponent({
  label,
  icon,
  removable = false,
  onRemove,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variantStyles[variant],
        sizeVariants[size],
        className
      )}
    >
      {icon && <span>{icon}</span>}
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
