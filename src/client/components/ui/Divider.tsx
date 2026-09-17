import { cn } from '@client/lib/utils'

interface DividerProps {
  text?: string
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function Divider({ text, className, orientation = 'horizontal' }: DividerProps) {
  if (orientation === 'vertical') {
    return <div className={cn('w-px h-full bg-neutral-200', className)} />
  }

  if (!text) {
    return <div className={cn('w-full h-px bg-neutral-200', className)} />
  }

  return (
    <div className={cn('relative flex items-center gap-4 my-6', className)}>
      <div className="flex-1 h-px bg-neutral-200" />
      <span className="text-sm text-neutral-500 font-medium px-2">{text}</span>
      <div className="flex-1 h-px bg-neutral-200" />
    </div>
  )
}
