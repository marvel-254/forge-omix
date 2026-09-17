import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@client/lib/utils'

const separatorVariants = cva('', {
  variants: {
    orientation: {
      horizontal: 'w-full h-px bg-neutral-200',
      vertical: 'h-full w-px bg-neutral-200 inline-block',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
})

export type SeparatorVariants = VariantProps<typeof separatorVariants>

interface SeparatorProps {
  orientation?: SeparatorVariants['orientation']
  className?: string
}

export function Separator({ orientation, className }: SeparatorProps) {
  return <div className={cn(separatorVariants({ orientation }), className)} />
}