import { useMemo } from 'react'
import { useSchemaStore } from '../store/schemaStore'
import type { Component, DesignTokens } from '@client/types/schema'

interface ComponentRendererProps {
  component: Component
  selected: boolean
  viewport?: 'desktop' | 'tablet' | 'mobile'
  scale?: number
  onSelect: (id: string) => void
}

/**
 * Resolves `$ref` design-token references in props, e.g.
 *   { $ref: 'designTokens.colors.primary' }
 * Token paths are looked up in project.designTokens; unresolved
 * references are left in place so the renderer shows the intent.
 */
export function resolveTokenRefs<T extends Record<string, unknown>>(
  props: T,
  tokens?: DesignTokens | null
): T {
  if (!tokens) return props
  const resolved: Record<string, unknown> = { ...props }
  for (const key of Object.keys(resolved)) {
    const value = resolved[key]
    if (
      value &&
      typeof value === 'object' &&
      '$ref' in (value as Record<string, unknown>)
    ) {
      const path = String((value as { $ref: unknown }).$ref)
        .replace(/^designTokens\./, '')
        .split('.')
      let current: unknown = tokens
      for (const segment of path) {
        if (current && typeof current === 'object' && segment in (current as object)) {
          current = (current as Record<string, unknown>)[segment]
        } else {
          current = undefined
          break
        }
      }
      if (current !== undefined && typeof current !== 'object') {
        resolved[key] = current
      }
    }
  }
  return resolved as T
}

interface ComponentPosition {
  x?: number
  y?: number
}

interface ComponentSize {
  width?: number
  height?: number
}

export function ComponentRenderer({
  component,
  selected,
  scale = 1,
  onSelect,
}: ComponentRendererProps) {
  const designTokens = useSchemaStore((s) => s.project?.designTokens)

  const resolvedProps = useMemo(
    () => resolveTokenRefs(component.props ?? {}, designTokens),
    [component.props, designTokens]
  )

  const position = (component as { position?: ComponentPosition }).position
  const size = (component as { size?: ComponentSize }).size

  return (
    <div
      data-component-id={component.id}
      className={`absolute ${selected ? 'ring-2 ring-primary-500' : ''}`}
      style={{
        left: position?.x ?? 0,
        top: position?.y ?? 0,
        width: size?.width ?? 120,
        height: size?.height ?? 'auto',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        cursor: 'pointer',
        zIndex: selected ? 1000 : 1,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(component.id)
      }}
    >
      <pre className="text-xs bg-white border rounded p-2 shadow-sm max-w-full overflow-hidden">
        {JSON.stringify({ type: component.type, ...resolvedProps }, null, 2)}
      </pre>
    </div>
  )
}

export default ComponentRenderer
