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
 */

export function componentsToPuckContent(components: Component[]): Data['content'] {
  return components.map((component) => ({
    type: component.type,
    props: {
      ...(component.props ?? {}),
      id: component.id,
    },
  })) as Data['content']
}

export function puckContentToComponents(content: Data['content'] | undefined): Component[] {
  if (!content) return []
  return content.map((item) => {
    const { id, ...props } = (item.props ?? {}) as Record<string, unknown> & { id?: string }
    return {
      id: id ?? 'comp_unknown',
      type: item.type,
      props,
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
  const updated: Project = {
    ...project,
    pages: project.pages.map((p) =>
      p.id === page.id
        ? { ...p, components: puckContentToComponents(content) }
        : p
    ) as Project['pages'],
  }
  return updated
}
