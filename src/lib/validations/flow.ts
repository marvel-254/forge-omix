import { z } from 'zod'

/**
 * Flow schema for API validation.
 * Permissive: steps/transitions/triggers are editor-managed structures.
 */
export const flowSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    version: z.string().max(50).optional(),
    steps: z.array(z.record(z.unknown())).default([]),
    transitions: z.array(z.record(z.unknown())).optional(),
    triggers: z.array(z.record(z.unknown())).optional(),
  })
  .passthrough()

export type FlowInput = z.infer<typeof flowSchema>
