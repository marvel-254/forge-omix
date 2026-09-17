import { z } from 'zod'

/**
 * Project schema for API validation.
 * Aligned with the `projects` table columns so validated data
 * can be persisted directly (timestamps are set by the server).
 */
export const projectSchema = z
  .object({
    id: z.string().min(1).max(100).optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(1000).nullish(),
    version: z.string().max(50).optional(),
    framework: z.string().max(50).optional(),
    cssStrategy: z.string().max(50).optional(),
    routerMode: z.string().max(50).optional(),
    // Relational payloads are accepted (canonical project shape) but not
    // persisted via this endpoint — manage them through their own routes.
    pages: z.array(z.unknown()).optional(),
    components: z.array(z.unknown()).optional(),
    flows: z.array(z.unknown()).optional(),
    tasks: z.array(z.unknown()).optional(),
    templates: z.array(z.unknown()).optional(),
    designTokens: z.record(z.unknown()).optional(),
    settings: z.record(z.unknown()).optional(),
  })
  .strict()

export type ProjectInput = z.infer<typeof projectSchema>
