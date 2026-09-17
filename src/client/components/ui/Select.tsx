import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface SelectOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

interface SelectProps {
  value?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
  label?: string
  required?: boolean
  className?: string
  id?: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  error,
  label,
  required,
  className,
  id,
}: SelectProps) {
  return (
    <div className={cn(className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border rounded-md bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
          disabled ? 'opacity-50 cursor-not-allowed bg-neutral-50' : 'hover:border-neutral-400',
          error ? 'border-red-300 focus:ring-red-500' : 'border-neutral-300'
        )}
        required={required}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}