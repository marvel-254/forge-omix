import { z } from 'zod'

/**
 * Template schema for API validation.
 *
 * Doc-shape validator aligned toward the canonical
 * `schemas/template.schema.json`: id pattern, semver version, category enum,
 * and constrained tags. The `schema` content payload stays optional here —
 * the canonical document validator (`TemplateSchema` in
 * `src/server/validation`) requires it, while this API layer stays permissive
 * so import/export round-trips are not rejected before canonical validation.
 */
export const templateSchema = z
  .object({
    id: z.string().regex(/^tmpl_[a-zA-Z0-9_-]{4,}$/),
    name: z.string().min(1).max(100),
    version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/),
    description: z.string().max(1000).optional(),
    category: z
      .enum([
        'landing',
        'dashboard',
        'e-commerce',
        'blog',
        'portfolio',
        'auth',
        'form',
        'layout',
        'component',
        'page',
        'flow',
        'other',
      ])
      .optional(),
    tags: z.array(z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/).max(30)).max(20).optional(),
    schema: z.record(z.unknown()).optional(),
  })
  .passthrough()

export type TemplateInput = z.infer<typeof templateSchema>
