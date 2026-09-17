import { cn } from '@client/lib/utils'

interface TextAreaProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  label?: string
  required?: boolean
  rows?: number
  className?: string
  id?: string
  maxLength?: number
}

export function TextArea({
  value,
  onChange,
  placeholder,
  disabled,
  error,
  label,
  required,
  rows = 4,
  className,
  id,
  maxLength,
}: TextAreaProps) {
  return (
    <div className={cn(className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        required={required}
        className={cn(
          'w-full px-3 py-2 border rounded-md bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical',
          disabled ? 'opacity-50 cursor-not-allowed bg-neutral-50' : 'hover:border-neutral-400',
          error ? 'border-red-300 focus:ring-red-500' : 'border-neutral-300'
        )}
      />
      {maxLength && (
        <p className="text-xs text-neutral-500 mt-1">
          {value?.length ?? 0} / {maxLength}
        </p>
      )}
    </div>
  )
}
