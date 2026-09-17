import { z } from 'zod'

/**
 * Component schema for API validation.
 * Aligned with the `components` table columns; the full component
 * definition (props, styles, interactions) lives in the `schema` JSON column.
 */
export const componentSchema = z
  .object({
    id: z.string().min(1).max(100).optional(),
    projectId: z.string().min(1),
    type: z.string().min(1).max(100),
    name: z.string().max(100).nullish(),
    schema: z.record(z.unknown()).optional(),
  })
  .strict()

export type ComponentInput = z.infer<typeof componentSchema>
