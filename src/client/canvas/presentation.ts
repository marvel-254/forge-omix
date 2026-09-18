import type { CSSProperties } from 'react'
import { useSchemaStore } from '../store/schemaStore'
import type { Component, DesignTokens } from '@client/types/schema'
import type { CanvasViewport } from './useCanvas'

/**
 * Presentation resolution for canvas renders (docs/05 §5.2–§5.3, §4.5).
 *
 * Pure core (`presentComponent`) merges, in increasing precedence:
 *   1. schema `props`
 *   2. matching-viewport `responsive[]` prop overrides
 * and derives:
 *   - `visible`: false when the matching entry sets `hidden`
 *   - `style`: `styles.base` with `$ref` values resolved + kebab→camelCase
 *   - `a11y`: role / aria-* / tabIndex attributes from `accessibility`
 *
 * Schema viewports (xs…2xl) are wider than the canvas simulator
 * (mobile/tablet/desktop); entries match the simulator's representative
 * breakpoint below.
 */

export const VIEWPORT_BREAKPOINT: Record<CanvasViewport, string> = {
  mobile: 'sm',
  tablet: 'md',
  desktop: 'lg',
}

interface ResponsiveEntry {
  breakpoint?: string
  props?: Record<string, unknown>
  styles?: Record<string, string | number>
  hidden?: boolean
}

/** Resolve a single `{ $ref: 'designTokens.…' }` value against tokens. */
export function resolveRefValue(value: unknown, tokens?: DesignTokens | null): unknown {
  if (!tokens || !value || typeof value !== 'object' || !('$ref' in value)) {
    return value
  }
  const path = String((value as { $ref: unknown }).$ref)
    .replace(/^designTokens\./, '')
    .split('.')
  let current: unknown = tokens
  for (const segment of path) {
    if (current && typeof current === 'object' && segment in (current as object)) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      return value
    }
  }
  return current !== undefined && typeof current !== 'object' ? current : value
}

const kebabToCamel = (key: string) => key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

/** Resolve `$ref` values inside a `styles.base`-style object. */
export function resolveStyleRefs(
  styles: Record<string, unknown> | undefined,
  tokens?: DesignTokens | null
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (!styles) return out
  for (const [key, value] of Object.entries(styles)) {
    const resolved = resolveRefValue(value, tokens)
    if (typeof resolved === 'string' || typeof resolved === 'number') {
      out[kebabToCamel(key)] = resolved
    }
  }
  return out
}

export interface PresentedComponent {
  visible: boolean
  /** props with the matching-viewport responsive overrides applied. */
  props: Record<string, unknown>
  /** Raw matching-entry prop overrides (before `$ref` resolution). */
  overrides: Record<string, unknown>
  /** Resolved `styles.base` (+ matching-entry style overrides) as CSS. */
  style: CSSProperties
  /** role / aria-* / tabIndex attributes from `accessibility`. */
  a11y: Record<string, string | number>
}

function readField(component: Component, field: string): unknown {
  return (component as unknown as Record<string, unknown>)[field]
}

export function presentComponent(
  component: Component,
  viewport: CanvasViewport,
  tokens?: DesignTokens | null
): PresentedComponent {
  const breakpoint = VIEWPORT_BREAKPOINT[viewport] ?? 'lg'
  const entries = (readField(component, 'responsive') ?? []) as ResponsiveEntry[]
  const entry = Array.isArray(entries) ? entries.find((e) => e?.breakpoint === breakpoint) : undefined

  // Base props first, viewport overrides win.
  const mergedProps = {
    ...((component.props ?? {}) as Record<string, unknown>),
    ...(entry?.props ?? {}),
  }

  const baseStyles = readField(component, 'styles') as
    | { base?: Record<string, unknown> }
    | undefined
  const style = {
    ...resolveStyleRefs(baseStyles?.base, tokens),
    ...resolveStyleRefs(entry?.styles as Record<string, unknown> | undefined, tokens),
  } as CSSProperties

  const a11ySource = (readField(component, 'accessibility') ?? {}) as Record<string, unknown>
  const a11y: Record<string, string | number> = {}
  if (typeof a11ySource.role === 'string' && a11ySource.role) a11y.role = a11ySource.role
  if (typeof a11ySource.label === 'string' && a11ySource.label) {
    a11y['aria-label'] = a11ySource.label
  }
  if (typeof a11ySource.labelledBy === 'string' && a11ySource.labelledBy) {
    a11y['aria-labelledby'] = a11ySource.labelledBy
  }
  if (typeof a11ySource.describedBy === 'string' && a11ySource.describedBy) {
    a11y['aria-describedby'] = a11ySource.describedBy
  }
  if (typeof a11ySource.tabIndex === 'number') a11y.tabIndex = a11ySource.tabIndex

  return {
    visible: entry?.hidden !== true,
    props: mergedProps,
    overrides: { ...(entry?.props ?? {}) },
    style,
    a11y,
  }
}

/** Hook version: looks the component up in the active page and presents it. */
export function useInstancePresentation(componentId: string): PresentedComponent | null {
  const project = useSchemaStore((s) => s.project)
  const activePageId = useSchemaStore((s) => s.activePageId)
  const viewport = useSchemaStore((s) => s.editorPrefs.viewport)
  const tokens = project?.designTokens ?? null
  const page = (project?.pages ?? []).find((p) => p.id === activePageId) ?? project?.pages[0]
  const component = (page?.components ?? []).find((c) => c.id === componentId) as
    | Component
    | undefined
  if (!component) return null
  return presentComponent(component, viewport, tokens)
}
