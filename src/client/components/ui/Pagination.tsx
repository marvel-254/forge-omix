import { cn } from '@client/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxButtons?: number
  showFirstLast?: boolean
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxButtons = 5,
  showFirstLast = true,
  className,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const halfMax = Math.floor(maxButtons / 2)

    let start = Math.max(1, currentPage - halfMax)
    let end = Math.min(totalPages, currentPage + halfMax)

    if (end - start < maxButtons - 1) {
      if (start === 1) {
        end = Math.min(totalPages, start + maxButtons - 1)
      } else {
        start = Math.max(1, end - maxButtons + 1)
      }
    }

    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)}>
      {showFirstLast && (
        <>
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={cn(
              'px-3 py-2 rounded border border-neutral-300 text-sm font-medium transition-colors',
              currentPage === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-neutral-100 hover:border-neutral-400'
            )}
          >
            ← First
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              'px-3 py-2 rounded border border-neutral-300 text-sm font-medium transition-colors',
              currentPage === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-neutral-100 hover:border-neutral-400'
            )}
          >
            ← Prev
          </button>
        </>
      )}

      {pages.map((page, index) =>
        page === '...' ? (
          <span key={`dots-${index}`} className="px-2 text-neutral-400">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={typeof page === 'string'}
            className={cn(
              'px-3 py-2 rounded border text-sm font-medium transition-colors',
              currentPage === page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400'
            )}
          >
            {page}
          </button>
        )
      )}

      {showFirstLast && (
        <>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              'px-3 py-2 rounded border border-neutral-300 text-sm font-medium transition-colors',
              currentPage === totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-neutral-100 hover:border-neutral-400'
            )}
          >
            Next →
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={cn(
              'px-3 py-2 rounded border border-neutral-300 text-sm font-medium transition-colors',
              currentPage === totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-neutral-100 hover:border-neutral-400'
            )}
          >
            Last →
          </button>
        </>
      )}
    </nav>
  )
}
