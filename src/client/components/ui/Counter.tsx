import { cn } from '@client/lib/utils'

interface CounterProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeVariants = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-base',
  lg: 'h-12 text-lg',
}

const buttonSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

export function Counter({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  disabled = false,
  size = 'md',
  className,
}: CounterProps) {
  const handleDecrement = () => {
    const newValue = Math.max(value - step, min)
    onChange(newValue)
  }

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max)
    onChange(newValue)
  }

  return (
    <div className={cn('inline-flex items-center border border-neutral-300 rounded-md', className)}>
      <button
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={cn(
          buttonSizes[size],
          'hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={cn(
          'w-16 text-center border-0 focus:outline-none focus:ring-0',
          sizeVariants[size]
        )}
      />
      <button
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={cn(
          buttonSizes[size],
          'hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        +
      </button>
    </div>
  )
}
