import { defaultVariableValues, substituteVariables } from './substitute'
import type { BuiltInTemplate } from './builtIn'

/**
 * Instantiate a template into a canonical project object (docs/06 §6.3
 * substitution process, steps 4–6). The caller validates the result with
 * `loadProject` before committing it to the store.
 */
export function instantiateTemplate(
  template: BuiltInTemplate,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const values = defaultVariableValues(template.variables, overrides)
  const schema = substituteVariables(template.schema, values)
  return {
    id: 'proj_' + Math.random().toString(36).slice(2, 10),
    name: schema.name ?? template.name,
    version: schema.version ?? '1.0.0',
    pages: schema.pages ?? [],
    components: schema.components ?? [],
    ...(schema.designTokens ? { designTokens: schema.designTokens } : {}),
  }
}

/** Project-shaped payload exported as a portable template file (docs/06 §6.5). */
export function exportProjectAsTemplate(
  project: Record<string, unknown>,
  meta: { name: string; description?: string; category?: string }
): Record<string, unknown> {
  const pages = project.pages as Array<Record<string, unknown>> | undefined
  return {
    $schema: 'https://forge-omix.io/schemas/template.schema.json',
    format: 'forge-omix-template',
    id: 'tmpl_' + Math.random().toString(36).slice(2, 10),
    name: meta.name,
    ...(meta.description ? { description: meta.description } : {}),
    version: typeof project.version === 'string' ? project.version : '1.0.0',
    category: meta.category ?? 'other',
    tags: ['exported'],
    variables: [],
    schema: {
      name: project.name,
      version: project.version,
      pages: pages ?? [],
      components: project.components ?? [],
      ...(project.designTokens ? { designTokens: project.designTokens } : {}),
    },
  }
}

/**
 * Detect whether an imported JSON document is a template file
 * (canonical Template with `variables` + `schema`) as opposed to a
 * project export or raw project.
 */
export function isTemplateDocument(doc: unknown): doc is {
  id: string
  name: string
  version: string
  variables?: Array<Record<string, unknown>>
  schema?: Record<string, unknown>
} {
  if (!doc || typeof doc !== 'object') return false
  const d = doc as Record<string, unknown>
  return (
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    typeof d.version === 'string' &&
    typeof d.schema === 'object' &&
    d.schema !== null &&
    !Array.isArray(d.schema)
  )
}

/** Normalize an imported template file into a BuiltInTemplate for the gallery form. */
export function normalizeImportedTemplate(doc: Record<string, unknown>): BuiltInTemplate {
  const schema = (doc.schema ?? {}) as BuiltInTemplate['schema']
  return {
    id: typeof doc.id === 'string' ? doc.id : 'tmpl_imported',
    name: typeof doc.name === 'string' ? doc.name : 'Imported template',
    description: typeof doc.description === 'string' ? doc.description : 'Imported from file',
    category: 'other',
    tags: Array.isArray(doc.tags) ? (doc.tags as string[]).filter((t) => typeof t === 'string') : [],
    variables: Array.isArray(doc.variables)
      ? (doc.variables as BuiltInTemplate['variables'])
      : [],
    schema,
  }
}
