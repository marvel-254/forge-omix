import { describe, it, expect, beforeEach } from 'vitest'
import { useSchemaStore } from '@client/store/schemaStore'
import type { Component } from '@client/types/schema'

/**
 * Unit tests for the moveComponentInPage action backing the layers
 * panel's drag-to-reorder and up/down buttons.
 */

function makeComponent(id: string): Component {
  return {
    id,
    type: 'Button',
    props: { label: id },
  } as unknown as Component
}

function seedProject(componentIds: string[]) {
  useSchemaStore.setState({
    project: {
      id: 'proj_test1234',
      name: 'Test Project',
      version: '1.0.0',
      pages: [
        {
          id: 'page_home',
          path: '/',
          title: 'Home',
          components: componentIds.map(makeComponent),
        },
      ],
      components: [],
    } as never,
    activePageId: 'page_home',
    selectedIds: new Set<string>(),
    canvasRevision: 0,
  })
}

function currentOrder(): string[] {
  const project = useSchemaStore.getState().project
  const page = project?.pages.find((p) => p.id === 'page_home')
  return (page?.components ?? []).map((c) => c.id)
}

describe('schemaStore.moveComponentInPage', () => {
  beforeEach(() => {
    seedProject(['comp_aaa1', 'comp_bbb2', 'comp_ccc3'])
  })

  it('moves a component down within the page', () => {
    const result = useSchemaStore.getState().actions.moveComponentInPage('comp_aaa1', 1)
    expect(result.valid).toBe(true)
    expect(currentOrder()).toEqual(['comp_bbb2', 'comp_aaa1', 'comp_ccc3'])
  })

  it('moves a component up within the page', () => {
    useSchemaStore.getState().actions.moveComponentInPage('comp_ccc3', 0)
    expect(currentOrder()).toEqual(['comp_ccc3', 'comp_aaa1', 'comp_bbb2'])
  })

  it('bumps canvasRevision so Puck remounts with the new order', () => {
    const before = useSchemaStore.getState().canvasRevision
    useSchemaStore.getState().actions.moveComponentInPage('comp_aaa1', 2)
    expect(useSchemaStore.getState().canvasRevision).toBe(before + 1)
  })

  it('clamps out-of-range indices', () => {
    useSchemaStore.getState().actions.moveComponentInPage('comp_aaa1', 99)
    expect(currentOrder()).toEqual(['comp_bbb2', 'comp_ccc3', 'comp_aaa1'])
    useSchemaStore.getState().actions.moveComponentInPage('comp_aaa1', -5)
    expect(currentOrder()).toEqual(['comp_aaa1', 'comp_bbb2', 'comp_ccc3'])
  })

  it('is a no-op when the component is already at the target index', () => {
    const before = useSchemaStore.getState().canvasRevision
    const result = useSchemaStore.getState().actions.moveComponentInPage('comp_bbb2', 1)
    expect(result.valid).toBe(true)
    expect(currentOrder()).toEqual(['comp_aaa1', 'comp_bbb2', 'comp_ccc3'])
    expect(useSchemaStore.getState().canvasRevision).toBe(before)
  })

  it('rejects unknown component ids', () => {
    const result = useSchemaStore.getState().actions.moveComponentInPage('comp_zzz9', 0)
    expect(result.valid).toBe(false)
    expect(currentOrder()).toEqual(['comp_aaa1', 'comp_bbb2', 'comp_ccc3'])
  })
})
