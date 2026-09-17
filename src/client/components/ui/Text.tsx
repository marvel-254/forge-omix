import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@client/lib/utils'

const textVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-4xl font-bold',
      h2: 'text-3xl font-bold',
      h3: 'text-2xl font-semibold',
      h4: 'text-xl font-semibold',
      h5: 'text-lg font-semibold',
      h6: 'text-base font-semibold',
      body: 'text-base',
      small: 'text-sm',
      xs: 'text-xs',
    },
    textColor: {
      default: 'text-neutral-900',
      muted: 'text-neutral-500',
      primary: 'text-blue-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600',
    },
  },
  defaultVariants: {
    variant: 'body',
    textColor: 'default',
  },
})

export type TextVariants = VariantProps<typeof textVariants>

interface TextProps {
  variant?: TextVariants['variant']
  textColor?: TextVariants['textColor']
  className?: string
  children: ReactNode
}

export function Text({ variant, textColor, className, children }: TextProps) {
  const Element = (variant?.startsWith('h') ? variant : 'span') as keyof JSX.IntrinsicElements

  return (
    <Element className={cn(textVariants({ variant, textColor }), className)}>
      {children}
    </Element>
  )
}