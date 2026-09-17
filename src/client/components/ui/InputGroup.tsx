import { cn } from '@client/lib/utils'

interface InputGroupProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function InputGroup({
  label,
  error,
  hint,
  required,
  className,
  children,
}: InputGroupProps) {
  return (
    <div className={cn('mb-4', className)}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}