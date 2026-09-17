import { z } from 'zod'

/**
 * Template schema for API validation.
 * Permissive: template payloads round-trip through import/export.
 */
export const templateSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(200),
    version: z.string().min(1).max(50),
    description: z.string().max(1000).optional(),
    category: z.string().max(50).optional(),
    tags: z.array(z.string()).optional(),
  })
  .passthrough()

export type TemplateInput = z.infer<typeof templateSchema>
