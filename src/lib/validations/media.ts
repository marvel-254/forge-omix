import { z } from 'zod'

/**
 * Media schema for API validation (image/video assets).
 * Aligned with docs/17-media-handling.md: URLs, dimensions, and alt text.
 */
export const mediaSchema = z
  .object({
    id: z.string().min(1).optional(),
    type: z.enum(['image', 'video']).default('image'),
    src: z.string().min(1),
    alt: z.string().max(500).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .passthrough()

export type MediaInput = z.infer<typeof mediaSchema>
