import { z } from 'zod'
import { ComponentSchema, PageSchema } from '../validation'

/**
 * AI response validation (docs/09 §9.9): structural validation, token
 * resolution, and safety checks before anything touches the project.
 */

export interface AIResponseValidation {
  valid: boolean
  errors: string[]
}

const UNSAFE_PATTERNS = ['eval(', 'Function(', '<script', 'javascript:', '__proto__']

/** Component/page operations the builder can apply from AI output. */
export const AddComponentOpSchema = z.object({
  action: z.literal('add-component'),
  component: ComponentSchema,
})

export const AddPageOpSchema = z.object({
  action: z.literal('add-page'),
  page: PageSchema,
})

export const AiOperationSchema = z.union([AddComponentOpSchema, AddPageOpSchema])

export type AiOperation = z.infer<typeof AiOperationSchema>

/**
 * Extract fenced ```json blocks from a chat response. Returns parsed
 * values (or parse-error markers) in document order.
 */
export function extractJsonBlocks(content: string): Array<{ ok: true; value: unknown } | { ok: false; error: string }> {
  const results: Array<{ ok: true; value: unknown } | { ok: false; error: string }> = []
  const fence = /```(?:json)?\s*\n([\s\S]*?)\n?```/g
  let match: RegExpExecArray | null
  while ((match = fence.exec(content)) !== null) {
    try {
      results.push({ ok: true, value: JSON.parse(match[1]) })
    } catch {
      results.push({ ok: false, error: 'Block is not valid JSON' })
    }
  }
  return results
}

/** Validate one parsed operation (structure + safety). */
export function validateAiOperation(value: unknown): AIResponseValidation & { operation?: AiOperation } {
  const parsed = AiOperationSchema.safeParse(value)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      valid: false,
      errors: [`${first?.path.join('.') || 'operation'}: ${first?.message || 'invalid'}`],
    }
  }
  const serialized = JSON.stringify(value)
  const unsafe = UNSAFE_PATTERNS.find((pattern) => serialized.includes(pattern))
  if (unsafe) {
    return { valid: false, errors: [`Response contains disallowed content (${unsafe.trim() || 'unsafe'})`] }
  }
  return { valid: true, errors: [], operation: parsed.data }
}
