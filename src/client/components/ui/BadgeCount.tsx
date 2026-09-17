import { cn } from '@client/lib/utils'

interface BadgeCountProps {
  count: number
  max?: number
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}

const variantStyles = {
  default: 'bg-neutral-600 text-white',
  primary: 'bg-blue-600 text-white',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-600 text-white',
  danger: 'bg-red-600 text-white',
}

export function BadgeCount({
  count,
  max = 99,
  variant = 'primary',
  className,
}: BadgeCountProps) {
  const displayCount = count > max ? `${max}+` : count

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold',
        variantStyles[variant],
        className
      )}
    >
      {displayCount}
    </span>
  )
}
