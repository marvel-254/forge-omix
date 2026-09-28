/**
 * Template variable substitution (docs/06 §6.3).
 *
 * Variables are referenced with `{{variableName}}` syntax anywhere inside a
 * template's `schema` payload:
 * - a string that is exactly `{{var}}` is replaced by the TYPED value
 *   (so numbers/booleans/objects survive substitution)
 * - `{{var}}` embedded in a longer string interpolates to text
 * - unknown variables are left in place (never silently dropped)
 */

export interface TemplateVariableDef {
  name: string
  type: 'string' | 'number' | 'boolean' | 'color' | 'image' | 'component' | 'array' | 'object'
  description?: string
  default?: unknown
  required?: boolean
  options?: unknown[]
}

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g
const EXACT_PLACEHOLDER_RE = /^\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}$/

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

/**
 * Validate one variable value against its definition.
 * Returns an error message, or null when the value is acceptable.
 */
export function validateVariableValue(
  variable: TemplateVariableDef,
  value: unknown
): string | null {
  const missing = value === undefined || value === null || value === ''
  if (missing) {
    return variable.required ? `"${variable.name}" is required` : null
  }
  switch (variable.type) {
    case 'string':
    case 'image':
    case 'component':
      return typeof value === 'string' ? null : `"${variable.name}" must be text`
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
        ? null
        : `"${variable.name}" must be a number`
    case 'boolean':
      return typeof value === 'boolean' ? null : `"${variable.name}" must be true or false`
    case 'color':
      return typeof value === 'string' && HEX_COLOR_RE.test(value.trim())
        ? null
        : `"${variable.name}" must be a hex color like #3b82f6`
    case 'array':
      return Array.isArray(value) ? null : `"${variable.name}" must be a list`
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? null
        : `"${variable.name}" must be an object`
    default:
      return null
  }
}

/** Fill every variable with its default; explicit values win. */
export function defaultVariableValues(
  variables: TemplateVariableDef[],
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const v of variables) {
    if (overrides[v.name] !== undefined) values[v.name] = overrides[v.name]
    else if (v.default !== undefined) values[v.name] = v.default
  }
  return values
}

/** Validate a full value set; returns errors keyed by variable name. */
export function validateVariableSet(
  variables: TemplateVariableDef[],
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const v of variables) {
    const error = validateVariableValue(v, values[v.name])
    if (error) errors[v.name] = error
  }
  return errors
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value) ?? ''
  } catch {
    return ''
  }
}

function substituteString(input: string, values: Record<string, unknown>): unknown {
  const exact = EXACT_PLACEHOLDER_RE.exec(input)
  if (exact) {
    const name = exact[1]
    // Whole-string placeholder: keep the typed value; unknown vars stay.
    return name in values ? (values[name] as unknown) : input
  }
  PLACEHOLDER_RE.lastIndex = 0
  return input.replace(PLACEHOLDER_RE, (_match, name: string) =>
    name in values ? toText(values[name]) : _match
  )
}

/** Deep-substitute `{{var}}` placeholders throughout a JSON-like value. */
export function substituteVariables<T>(schema: T, values: Record<string, unknown>): T {
  if (typeof schema === 'string') {
    return substituteString(schema, values) as T
  }
  if (Array.isArray(schema)) {
    return schema.map((item) => substituteVariables(item, values)) as T
  }
  if (schema !== null && typeof schema === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(schema)) {
      out[key] = substituteVariables(value, values)
    }
    return out as T
  }
  return schema
}
