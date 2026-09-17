import { cn } from '@client/lib/utils'

interface CopyableProps {
  text: string
  onCopied?: () => void
  className?: string
  children?: React.ReactNode
}

export function Copyable({ text, onCopied, className, children }: CopyableProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded text-sm border border-neutral-300 hover:bg-neutral-50 transition-colors',
        className
      )}
    >
      {children || text}
      <span className="text-xs">{copied ? '✓' : '📋'}</span>
    </button>
  )
}

import * as React from 'react'
