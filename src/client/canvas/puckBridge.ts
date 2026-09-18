import type { Data } from '@measured/puck'
import type { Component, Project } from '@client/types/schema'

/**
 * Bridge between the universal schema (src/server/types) and Puck's Data format.
 *
 * Schema Component:  { id: 'comp_x', type: 'Button', props: { label } }
 * Puck ComponentData: { type: 'Button', props: { label, id: 'comp_x' } }
 *
 * Puck requires a `props.id` on every content item, so the schema id is
 * copied into props on the way in and stripped on the way out.
 *
 * Non-prop component fields (name, children, styles, interactions,
 * responsive, accessibility, version) have no Puck equivalent, so they ride
 * along opaquely under the reserved `__omix` props key (never a declared
 * Puck field, so Puck edits leave it intact) and are restored on the way
 * out. Do not use `__omix` as a real component prop name.
 */

export const OMIX_META_KEY = '__omix'

const META_FIELDS = [
  'name',
  'children',
  'styles',
  'interactions',
  'responsive',
  'accessibility',
  'version',
] as const

export function componentsToPuckContent(components: Component[]): Data['content'] {
  return components.map((component) => {
    const source = component as unknown as Record<string, unknown>
    const meta: Record<string, unknown> = {}
    for (const field of META_FIELDS) {
      if (source[field] !== undefined) meta[field] = source[field]
    }
    return {
      type: component.type,
      props: {
        ...(component.props ?? {}),
        id: component.id,
        ...(Object.keys(meta).length > 0 ? { [OMIX_META_KEY]: meta } : {}),
      },
    }
  }) as Data['content']
}

export function puckContentToComponents(
  content: Data['content'] | undefined,
  prevById?: Map<string, Component>
): Component[] {
  if (!content) return []
  return content.map((item) => {
    const raw = { ...((item.props ?? {}) as Record<string, unknown>) }
    const id = typeof raw.id === 'string' ? raw.id : 'comp_unknown'
    delete raw.id
    const meta = raw[OMIX_META_KEY]
    delete raw[OMIX_META_KEY]
    // Ownership split: Puck owns type+props, but it holds a potentially
    // stale copy of metadata (panel edits don't remount Puck). The store's
    // previous version is fresher for meta fields; fall back to the
    // Puck-carried copy (e.g. Puck-side duplicates) when unknown to the store.
    const prev = prevById?.get(id) as unknown as Record<string, unknown> | undefined
    const carried = meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : {}
    const merged: Record<string, unknown> = {}
    for (const field of META_FIELDS) {
      const stored = prev?.[field]
      merged[field] = stored !== undefined ? stored : carried[field]
      if (merged[field] === undefined) delete merged[field]
    }
    return {
      id,
      type: item.type,
      ...merged,
      props: raw,
    } as unknown as Component
  })
}

/** Resolve the page being edited (falls back to the first page). */
export function resolveActivePage(project: Project | null, activePageId: string | null | undefined) {
  const pages = project?.pages ?? []
  return pages.find((p) => p.id === activePageId) ?? pages[0] ?? null
}

/** Build a Puck Data object for the given page of the project. */
export function pageToPuckData(
  project: Project | null,
  activePageId: string | null | undefined
): Data {
  const page = resolveActivePage(project, activePageId)
  return {
    content: componentsToPuckContent((page?.components ?? []) as Component[]),
    root: { props: { title: page?.title ?? 'Home' } },
  }
}

/** Merge Puck content back into the specified page of the project. */
export function applyPuckContentToPage(
  project: Project,
  activePageId: string | null | undefined,
  content: Data['content']
): Project {
  const page = resolveActivePage(project, activePageId)
  if (!page) return project
  // Pass current components so store-side metadata (set outside Puck)
  // survives Puck edits made from a stale mounted copy.
  const prevById = new Map(
    ((page.components ?? []) as Component[]).map((c) => [c.id, c])
  )
  const updated: Project = {
    ...project,
    pages: project.pages.map((p) =>
      p.id === page.id
        ? { ...p, components: puckContentToComponents(content, prevById) }
        : p
    ) as Project['pages'],
  }
  return updated
}
