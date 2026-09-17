import { z } from 'zod'

export const PaginationSchema = z.object({
  limit: z.number().int().positive().default(20).pipe(z.number().max(100)),
  offset: z.number().int().nonnegative().default(0),
})

export type Pagination = z.infer<typeof PaginationSchema>

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/**
 * Helper to extract pagination from query params
 */
export function parsePagination(query: Record<string, string | string[] | undefined>): Pagination {
  const limit = parseInt(String(query.limit ?? '20'), 10) || 20
  const offset = parseInt(String(query.offset ?? '0'), 10) || 0

  return {
    limit: Math.min(Math.max(limit, 1), 100),
    offset: Math.max(offset, 0),
  }
}