import { z } from 'zod'
import type { DesignTokens } from '../../types'

/**
 * Design tokens schema for validation.
 * Mirrors the client-facing DesignTokens contract in src/types:
 * - colors can be a single CSS color or a palette of shades
 * - breakpoints allow CSS length strings (editor form values)
 * - unknown keys are preserved (passthrough) so editors can round-trip data
 */
export const designTokensSchema = z
  .object({
    colors: z.record(z.union([z.string(), z.record(z.string())])),
    typography: z.record(z.unknown()),
    spacing: z.record(z.string()),
    radius: z.record(z.string()),
    shadows: z.record(z.string()),
    breakpoints: z.record(z.union([z.string(), z.number()])),
    motion: z.unknown().optional(),
    zIndex: z.record(z.number()).optional(),
  })
  .passthrough()

export type DesignTokensInput = z.infer<typeof designTokensSchema>

export type DesignTokensOutput = DesignTokens
