import { cn } from '@client/lib/utils'

interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  direction?: 'vertical' | 'horizontal'
  className?: string
}

const sizeMap = {
  xs: { vertical: 'h-2', horizontal: 'w-2' },
  sm: { vertical: 'h-4', horizontal: 'w-4' },
  md: { vertical: 'h-8', horizontal: 'w-8' },
  lg: { vertical: 'h-12', horizontal: 'w-12' },
  xl: { vertical: 'h-16', horizontal: 'w-16' },
}

export function Spacer({
  size = 'md',
  direction = 'vertical',
  className,
}: SpacerProps) {
  const dimensions = sizeMap[size]
  return (
    <div
      className={cn(
        direction === 'vertical' ? dimensions.vertical : dimensions.horizontal,
        className
      )}
    />
  )
}
