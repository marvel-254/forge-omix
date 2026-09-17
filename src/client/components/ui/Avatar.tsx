import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@client/lib/utils'

const avatarVariants = cva('inline-flex items-center justify-center rounded-full font-semibold text-white', {
  variants: {
    size: {
      sm: 'h-6 w-6 text-xs',
      md: 'h-8 w-8 text-sm',
      lg: 'h-10 w-10 text-base',
      xl: 'h-12 w-12 text-lg',
    },
    color: {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'blue',
  },
})

export type AvatarVariants = VariantProps<typeof avatarVariants>

interface AvatarProps {
  size?: AvatarVariants['size']
  color?: AvatarVariants['color']
  src?: string
  alt?: string
  initials?: string
  className?: string
  children?: ReactNode
}

export function Avatar({
  size,
  color,
  src,
  alt,
  initials,
  className,
  children,
}: AvatarProps) {
  const content = src ? (
    <img src={src} alt={alt || 'avatar'} className="h-full w-full object-cover" />
  ) : initials ? (
    initials.slice(0, 2).toUpperCase()
  ) : (
    children
  )

  return (
    <div className={cn(avatarVariants({ size, color }), 'overflow-hidden', className)} role="img" aria-label={alt}>
      {content}
    </div>
  )
}