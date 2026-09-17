import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface FormProps {
  onSubmit: (e: React.FormEvent) => void
  children: ReactNode
  className?: string
}

export function Form({ onSubmit, children, className }: FormProps) {
  return (
    <form onSubmit={onSubmit} className={cn(className)}>
      {children}
    </form>
  )
}

interface FormFieldProps {
  className?: string
  children: ReactNode
}

export function FormField({ className, children }: FormFieldProps) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

interface FormLabelProps {
  htmlFor?: string
  children: ReactNode
  required?: boolean
  className?: string
}

export function FormLabel({
  htmlFor,
  children,
  required,
  className,
}: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('block text-sm font-medium text-neutral-700 mb-2', className)}
    >
      {children}
      {required && <span className="text-red-600 ml-1">*</span>}
    </label>
  )
}

interface FormErrorProps {
  message?: string
  className?: string
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null
  return (
    <p className={cn('text-xs text-red-600 mt-1', className)}>
      {message}
    </p>
  )
}
