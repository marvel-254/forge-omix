import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface RadioOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

interface RadioProps {
  name: string
  value?: string
  options: RadioOption[]
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
  inline?: boolean
  required?: boolean
}

export function Radio({
  name,
  value,
  options,
  onChange,
  disabled,
  className,
  inline = false,
  required,
}: RadioProps) {
  return (
    <div className={cn('flex', inline ? 'gap-4' : 'flex-col gap-3', className)}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <input
            type="radio"
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={disabled || option.disabled}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              'h-4 w-4 rounded-full border border-neutral-300 cursor-pointer transition-colors appearance-none',
              value === option.value ? 'bg-blue-600 border-blue-600' : 'bg-white hover:border-neutral-400',
              (disabled || option.disabled) && 'opacity-50 cursor-not-allowed'
            )}
            required={required}
          />
          <label
            htmlFor={`${name}-${option.value}`}
            className={cn('text-sm', (disabled || option.disabled) && 'opacity-50 cursor-not-allowed')}
          >
            {option.label}
          </label>
        </div>
      ))}
    </div>
  )
}