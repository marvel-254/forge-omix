import type { Project } from '../types/schema'

/**
 * Privacy context filtering (docs/09 §9.7): trim the schema to the minimum
 * the task needs before anything leaves the machine for a cloud provider.
 */

export type ContextLevel = 'minimal' | 'standard' | 'full'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function componentTypeOf(component: unknown): string {
  return String(asRecord(component).type ?? 'unknown')
}

/** Strip a page down to path + component types (no prop values). */
function minimalPage(page: unknown): Record<string, unknown> {
  const record = asRecord(page)
  const components = Array.isArray(record.components) ? record.components : []
  return {
    path: record.path,
    componentTypes: components.map(componentTypeOf),
  }
}

/** Full tree minus free-form custom code fields. */
function standardProject(project: Project): Record<string, unknown> {
  const record: Record<string, unknown> = { ...(asRecord(project) as object) }
  if (Array.isArray(record.pages)) {
    record.pages = (record.pages as unknown[]).map((page) => {
      const { customCode: _dropped, ...rest } = asRecord(page)
      return rest
    })
  }
  return record
}

export function filterContext(project: Project, level: ContextLevel): unknown {
  const record = asRecord(project)
  switch (level) {
    case 'minimal': {
      const pages = Array.isArray(record.pages) ? record.pages : []
      return {
        pages: (pages as unknown[]).map(minimalPage),
        designTokens: record.designTokens,
      }
    }
    case 'standard':
      return standardProject(project)
    case 'full':
      return record
  }
}
