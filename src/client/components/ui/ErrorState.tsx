import { cn } from '@client/lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600 text-sm max-w-sm mb-6">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}