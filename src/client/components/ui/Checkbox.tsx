import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface CheckboxProps {
  id?: string
  checked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
  label?: ReactNode
  className?: string
  required?: boolean
}

export function Checkbox({
  id,
  checked = false,
  disabled = false,
  onChange,
  label,
  className,
  required,
}: CheckboxProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className={cn(
          'h-4 w-4 rounded border border-neutral-300 cursor-pointer transition-colors',
          checked ? 'bg-blue-600 border-blue-600' : 'bg-white hover:border-neutral-400',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          'appearance-none'
        )}
        required={required}
      />
      {label && (
        <label htmlFor={id} className={cn('text-sm', disabled && 'opacity-50 cursor-not-allowed')}>
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
    </div>
  )
}