import { cn } from '@client/lib/utils'

interface ChipProps {
  label: string
  onClick?: () => void
  onRemove?: () => void
  removable?: boolean
  selected?: boolean
  disabled?: boolean
  className?: string
}

export function Chip({
  label,
  onClick,
  onRemove,
  removable = false,
  selected = false,
  disabled = false,
  className,
}: ChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all',
        selected
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-neutral-100 text-neutral-900 border-neutral-300 hover:bg-neutral-200',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        className
      )}
      onClick={() => !disabled && onClick?.()}
    >
      {label}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="ml-1 text-lg leading-none hover:opacity-70"
        >
          ×
        </button>
      )}
    </div>
  )
}
