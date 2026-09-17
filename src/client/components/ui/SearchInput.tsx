import { cn } from '@client/lib/utils'

interface SearchInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  onClear?: () => void
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  className,
  onClear,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full pl-10 pr-10 py-2 border border-neutral-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
        >
          ×
        </button>
      )}
    </div>
  )
}