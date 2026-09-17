import { cn } from '@client/lib/utils'

interface IconButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

const sizeVariants = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
}

const variantStyles = {
  default: 'bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700',
  primary: 'bg-blue-600 border border-blue-600 hover:bg-blue-700 text-white',
  danger: 'bg-red-600 border border-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700',
}

export function IconButton({
  icon,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  ariaLabel,
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors',
        sizeVariants[size],
        variantStyles[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon}
    </button>
  )
}