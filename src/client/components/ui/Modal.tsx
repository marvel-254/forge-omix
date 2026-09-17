import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@client/lib/utils'

const modalVariants = cva('fixed inset-0 z-50 bg-black/50 flex items-center justify-center', {
  variants: {
    animated: {
      true: 'animate-fade-in',
      false: '',
    },
  },
  defaultVariants: {
    animated: true,
  },
})

const contentVariants = cva(
  'bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export type ModalVariants = VariantProps<typeof contentVariants>

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  size?: ModalVariants['size']
  animated?: boolean
  title?: string
  description?: string
  children?: ReactNode
  actions?: ReactNode
  closeButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  size,
  animated,
  title,
  description,
  children,
  actions,
  closeButton = true,
}: ModalProps) {
  if (!isOpen) return null

  return (
    <div className={cn(modalVariants({ animated }))}>
      <div className={cn(contentVariants({ size }))}>
        {/* Header */}
        {(title || closeButton) && (
          <div className="flex items-center justify-between border-b border-neutral-200 p-6">
            <div>
              {title && <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>}
              {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
            </div>
            {closeButton && (
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 text-2xl leading-none"
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {actions && <div className="flex gap-3 justify-end border-t border-neutral-200 p-6">{actions}</div>}
      </div>
    </div>
  )
}