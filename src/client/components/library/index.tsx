/**
 * Library facade for the component panel.
 *
 * The canvas registry is the single source of truth for what can be placed
 * on the canvas. Everything here derives from it, so the library can never
 * advertise a component the canvas cannot render (the previous hard-coded
 * catalog listed 27 types against 6 registered ones, and every unregistered
 * drop was silently discarded by Canvas.tsx).
 *
 * Previews render through the *same* render function the canvas uses, fed the
 * component's canonical `defaultProps`. That guarantees a preview cannot crash
 * on a missing required prop — the bug that blanked the whole app, where the
 * `Table` card was previewed with only a `label` and its required `columns`
 * was undefined.
 */

import { canvasRegistry, defaultPropsFor } from '../../canvas/registry'
import { COMPONENT_CATALOG, COMPONENT_CATEGORIES } from '../../canvas/componentCatalog'

export type ComponentType = keyof typeof canvasRegistry

/** Every type that can actually be placed on the canvas. */
export function getComponentList(): ComponentType[] {
  return Object.keys(canvasRegistry) as ComponentType[]
}

/**
 * The canvas render function for a type, for use as a preview component.
 * Typed loosely because Puck's `render` is invoked with `(props, context)`
 * while React only supplies `props`. Pair it with `defaultPropsFor(type)`.
 */
export function getComponent(type: ComponentType) {
  const config = canvasRegistry[type]
  return config?.render as unknown as
    | ((props: Record<string, unknown>) => React.ReactNode)
    | undefined
}

export interface LibraryCategory {
  category: string
  types: ComponentType[]
}

/**
 * Group the library by catalog category. Only categories with at least one
 * registered component are returned, so the panel never shows an empty group.
 */
export function getComponentCatalog(): LibraryCategory[] {
  return COMPONENT_CATEGORIES.map((c) => ({
    category: c.label,
    types: COMPONENT_CATALOG.filter((m) => m.category === c.id).map(
      (m) => m.type as ComponentType
    ),
  })).filter((group) => group.types.length > 0)
}

export { defaultPropsFor }