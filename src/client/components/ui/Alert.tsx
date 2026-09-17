import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface AlertProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  title?: string
  description?: string
  children?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

const variantStyles = {
  default: {
    container: 'bg-neutral-50 border border-neutral-200 text-neutral-900',
    icon: 'text-neutral-600',
  },
  success: {
    container: 'bg-green-50 border border-green-200 text-green-900',
    icon: 'text-green-600',
  },
  warning: {
    container: 'bg-yellow-50 border border-yellow-200 text-yellow-900',
    icon: 'text-yellow-600',
  },
  danger: {
    container: 'bg-red-50 border border-red-200 text-red-900',
    icon: 'text-red-600',
  },
  info: {
    container: 'bg-blue-50 border border-blue-200 text-blue-900',
    icon: 'text-blue-600',
  },
}

const icons = {
  default: 'ℹ',
  success: '✓',
  warning: '⚠',
  danger: '✕',
  info: 'ℹ',
}

export function Alert({
  variant = 'default',
  title,
  description,
  children,
  action,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  const [isDismissed, setIsDismissed] = React.useState(false)

  if (isDismissed) return null

  const styles = variantStyles[variant]

  return (
    <div className={cn('rounded-lg border p-4 flex gap-3', styles.container, className)}>
      <div className={cn('flex-shrink-0 text-lg leading-none', styles.icon)}>
        {icons[variant]}
      </div>
      <div className="flex-1">
        {title && <h3 className="font-semibold text-sm mb-1">{title}</h3>}
        {description && <p className="text-sm opacity-90">{description}</p>}
        {children && <div className="text-sm mt-2">{children}</div>}
      </div>
      {(action || dismissible) && (
        <div className="flex gap-2 flex-shrink-0">
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm font-semibold hover:underline whitespace-nowrap"
            >
              {action.label}
            </button>
          )}
          {dismissible && (
            <button
              onClick={() => {
                setIsDismissed(true)
                onDismiss?.()
              }}
              className="text-lg leading-none opacity-50 hover:opacity-100"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  )
}

import * as React from 'react'
