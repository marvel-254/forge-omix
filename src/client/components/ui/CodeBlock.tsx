import { cn } from '@client/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  className?: string
  copyable?: boolean
}

export function CodeBlock({
  code,
  showLineNumbers = true,
  className,
  copyable = true,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const lines = code.split('\n')

  return (
    <div
      className={cn(
        'relative bg-neutral-900 text-neutral-100 rounded-lg p-4 font-mono text-sm overflow-x-auto',
        className
      )}
    >
      {copyable && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      )}
      <pre>
        {lines.map((line, idx) => (
          <div key={idx} className="flex gap-4">
            {showLineNumbers && (
              <span className="text-neutral-600 select-none w-8 text-right">
                {idx + 1}
              </span>
            )}
            <span>{line}</span>
          </div>
        ))}
      </pre>
    </div>
  )
}

import * as React from 'react'
