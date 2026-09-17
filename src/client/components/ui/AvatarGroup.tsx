import { cn } from '@client/lib/utils'

interface AvatarGroupProps {
  avatars: Array<{
    src?: string
    name?: string
    fallback?: string
  }>
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeVariants = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
}

const overlapVariants = {
  sm: '-ml-2',
  md: '-ml-2',
  lg: '-ml-3',
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((avatar, idx) => (
        <div
          key={idx}
          className={cn(
            'rounded-full border-2 border-white overflow-hidden',
            sizeVariants[size],
            idx > 0 && overlapVariants[size]
          )}
        >
          {avatar.src ? (
            <img src={avatar.src} alt={avatar.name || 'avatar'} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-blue-500 text-white flex items-center justify-center font-medium">
              {avatar.fallback || avatar.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full border-2 border-white bg-neutral-200 text-neutral-600 flex items-center justify-center font-medium',
            sizeVariants[size],
            overlapVariants[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}