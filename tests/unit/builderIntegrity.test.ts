import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { canvasRegistry, defaultPropsFor } from '@/client/canvas/registry'
import { getComponentList } from '@/client/components/library'
import { BUILT_IN_TEMPLATES } from '@/client/templates/builtIn'
import { generateComponentJSX } from '@/lib/codegen/components'
import type { Component } from '@/server/types/schema'

/**
 * Cross-cutting integrity guards for the builder.
 *
 * These exist because the builder shipped three parallel descriptions of its
 * own component set — the canvas registry, the library catalog, and the
 * codegen dispatch table — which silently drifted: the library advertised 27
 * types the canvas could not render, and a preview could be handed an
 * incomplete prop set and throw. Each drift failed *silently* (a discarded
 * drop, a blank exported section), so each is pinned here.
 */

const registryTypes = Object.keys(canvasRegistry)

describe('component registry is the single source of truth', () => {
  it('exposes at least the core primitives and sections', () => {
    for (const type of ['Button', 'Input', 'Card', 'Navbar', 'Hero', 'Footer']) {
      expect(registryTypes).toContain(type)
    }
  })

  it('derives the library list from the registry, so no phantom components', () => {
    expect(getComponentList().sort()).toEqual(registryTypes.slice().sort())
  })

  it('gives every registered type a complete defaultProps object', () => {
    for (const type of registryTypes) {
      expect(defaultPropsFor(type), `${type} has no defaultProps`).toBeTypeOf('object')
    }
  })
})

describe('every registered component renders with its own defaults', () => {
  // Regression guard: the library used to preview components with only a
  // `label`, so `Table` received `columns === undefined` and threw on
  // `columns.map`. That throw was uncaught and unmounted the whole editor.
  //
  // Must go through a renderer: these are components (they call hooks), so
  // invoking `render` directly would violate the rules of hooks.
  const renderType = (type: string): string => {
    const render = canvasRegistry[type].render
    return renderToString(
      React.createElement(
        (props: Record<string, unknown>) =>
          render(props as unknown as Parameters<typeof render>[0], {
            puck: {},
          } as unknown as Parameters<typeof render>[1]) as React.ReactElement,
        { ...defaultPropsFor(type), id: `comp_guard${type.toLowerCase()}` }
      )
    )
  }

  it.each(registryTypes)('%s renders without throwing', (type) => {
    expect(() => renderType(type), `${type} threw while rendering`).not.toThrow()
  })

  it('renders a non-trivial string for each registered component', () => {
    for (const type of registryTypes) {
      expect(renderType(type).length, `${type} produced no markup`).toBeGreaterThan(0)
    }
  })
})

describe('every registered component has code generation', () => {
  // A registry entry without a codegen case exports as an empty comment,
  // so the site builds and silently drops the section.
  it('does not fall through to the unknown-type fallback', () => {
    for (const type of registryTypes) {
      const component = {
        id: 'comp_codegen',
        type,
        props: defaultPropsFor(type),
      } as unknown as Component
      const result = generateComponentJSX(component, {} as never, 'Var')
      expect(result.jsx, `${type} has no codegen case`).not.toContain(
        'Unsupported component type'
      )
    }
  })
})

describe('built-in templates only reference registered components', () => {
  it('resolves every component type a template names', () => {
    const missing: string[] = []
    for (const template of BUILT_IN_TEMPLATES) {
      for (const page of template.schema.pages ?? []) {
        for (const component of (page.components ?? []) as Array<Record<string, unknown>>) {
          const type = String(component.type ?? '')
          if (!canvasRegistry[type]) missing.push(`${template.id}: ${type}`)
        }
      }
    }
    expect(missing).toEqual([])
  })
})