import { type ReactNode, useEffect, useState } from 'react'
import { cn } from '@client/lib/utils'

const toastVariants = {
  success: 'bg-green-50 border border-green-200 text-green-900',
  error: 'bg-red-50 border border-red-200 text-red-900',
  warning: 'bg-yellow-50 border border-yellow-200 text-yellow-900',
  info: 'bg-blue-50 border border-blue-200 text-blue-900',
}

const iconVariants = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
}

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  title?: string
  message: ReactNode
  variant?: ToastVariant
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
  autoClose?: number
}

export function Toast({
  title,
  message,
  variant = 'info',
  action,
  onClose,
  autoClose = 5000,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // wait for fade animation
      }, autoClose)
      return () => clearTimeout(timer)
    }
  }, [autoClose, onClose])

  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed bottom-4 right-4 rounded-lg shadow-lg p-4 flex items-start gap-3 z-50 animate-fade-in',
      toastVariants[variant]
    )}>
      <div className={cn('flex-shrink-0 text-lg', iconVariants[variant])}>
        {icons[variant]}
      </div>
      <div className="flex-1">
        {title && <div className="font-semibold text-sm">{title}</div>}
        <div className="text-sm opacity-90">{message}</div>
      </div>
      {action && (
        <button onClick={action.onClick} className="text-sm font-semibold hover:underline flex-shrink-0">
          {action.label}
        </button>
      )}
      {onClose && (
        <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="text-lg leading-none flex-shrink-0 opacity-50 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  )
}