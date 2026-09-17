import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface SwitchProps {
  id?: string
  checked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
  label?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeVariants = {
  sm: 'w-8 h-5',
  md: 'w-10 h-6',
  lg: 'w-12 h-7',
}

const thumbSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function Switch({
  id,
  checked = false,
  disabled = false,
  onChange,
  label,
  className,
  size = 'md',
}: SwitchProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          sizeVariants[size],
          'rounded-full transition-colors cursor-pointer',
          checked ? 'bg-blue-600' : 'bg-neutral-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && onChange?.(!checked)}
      >
        <div
          className={cn(
            thumbSizes[size],
            'rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </div>
      {label && (
        <label className={cn('text-sm', disabled && 'opacity-50')} htmlFor={id}>
          {label}
        </label>
      )}
    </div>
  )
}
