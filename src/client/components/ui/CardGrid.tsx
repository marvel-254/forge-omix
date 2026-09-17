import { type ReactNode } from 'react'
import { cn } from '@client/lib/utils'

interface CardGridProps {
  items: ReactNode[]
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

const columnVariants = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

const gapVariants = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

export function CardGrid({
  items,
  columns = 3,
  gap = 'md',
  className,
}: CardGridProps) {
  return (
    <div className={cn('grid', columnVariants[columns], gapVariants[gap], className)}>
      {items.map((item, i) => (
        <div key={i}>{item}</div>
      ))}
    </div>
  )
}
