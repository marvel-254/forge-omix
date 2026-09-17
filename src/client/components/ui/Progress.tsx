import { cn } from '@client/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  label?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

const sizeVariants = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const variantColors = {
  default: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  danger: 'bg-red-600',
}

export function Progress({
  value,
  max = 100,
  label,
  showLabel = false,
  size = 'md',
  variant = 'default',
  className,
}: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={cn(className)}>
      {(label || showLabel) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-neutral-700">{label}</span>
          <span className="text-sm text-neutral-600">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-neutral-200 rounded-full overflow-hidden', sizeVariants[size])}>
        <div
          className={cn('h-full transition-all duration-300', variantColors[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
