import { cn } from '@client/lib/utils'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
  label?: string
  className?: string
}

const sizeVariants = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export function Loader({
  size = 'md',
  variant = 'spinner',
  label,
  className,
}: LoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      {variant === 'spinner' && (
        <div
          className={cn(
            sizeVariants[size],
            'border-3 border-neutral-200 border-t-blue-600 rounded-full animate-spin'
          )}
        />
      )}
      {variant === 'dots' && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full bg-blue-600 animate-pulse',
                size === 'sm' && 'w-2 h-2',
                size === 'md' && 'w-3 h-3',
                size === 'lg' && 'w-4 h-4'
              )}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
      {variant === 'pulse' && (
        <div
          className={cn(sizeVariants[size], 'rounded-full bg-blue-600 animate-pulse')}
        />
      )}
      {label && <p className="text-sm text-neutral-600">{label}</p>}
    </div>
  )
}
