import { cn } from '@client/lib/utils'

interface SkeletonProps {
  variant?: 'text' | 'avatar' | 'card' | 'line'
  width?: string | number
  height?: string | number
  count?: number
  className?: string
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className,
}: SkeletonProps) {
  const getDefaultDimensions = () => {
    switch (variant) {
      case 'avatar':
        return { width: '40px', height: '40px' }
      case 'card':
        return { width: '100%', height: '200px' }
      case 'line':
        return { width: '100%', height: '20px' }
      default:
        return { width: '100%', height: '16px' }
    }
  }

  const defaults = getDefaultDimensions()
  const finalWidth = width || defaults.width
  const finalHeight = height || defaults.height

  const skeletons = Array(count)
    .fill(null)
    .map((_, i) => (
      <div
        key={i}
        className={cn(
          'animate-pulse bg-neutral-200 rounded',
          variant === 'avatar' && 'rounded-full',
          className
        )}
        style={{
          width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
          height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
        }}
      />
    ))

  return count === 1 ? skeletons[0] : <div className="flex flex-col gap-2">{skeletons}</div>
}
