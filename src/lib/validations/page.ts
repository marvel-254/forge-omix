import { z } from 'zod'

/**
 * Page schema for API validation.
 * Aligned with the `pages` table columns; the full page definition
 * (component tree, layout, meta) lives in the `schema` JSON column.
 */
export const pageSchema = z
  .object({
    id: z.string().min(1).max(100).optional(),
    projectId: z.string().min(1),
    path: z.string().startsWith('/'),
    title: z.string().min(1).max(200),
    description: z.string().max(500).nullish(),
    schema: z.record(z.unknown()).optional(),
  })
  .strict()

export type PageInput = z.infer<typeof pageSchema>
