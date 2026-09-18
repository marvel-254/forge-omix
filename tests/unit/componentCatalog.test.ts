import { describe, it, expect } from 'vitest'
import {
  COMPONENT_CATALOG,
  COMPONENT_CATEGORIES,
  getCatalogByCategory,
  searchCatalog,
} from '@/client/canvas/componentCatalog'
import { canvasRegistry } from '@/client/canvas/registry'
import { getComponent, getComponentList } from '@/client/components/library'

describe('component catalog consistency', () => {
  it('covers every canvas registry type', () => {
    const catalogTypes = new Set(COMPONENT_CATALOG.map((m) => m.type))
    for (const type of Object.keys(canvasRegistry)) {
      expect(catalogTypes.has(type)).toBe(true)
    }
  })

  it('has no entries missing from the canvas registry', () => {
    for (const meta of COMPONENT_CATALOG) {
      expect(canvasRegistry[meta.type]).toBeDefined()
    }
  })

  it('matches the library preview registry', () => {
    const libraryTypes = new Set<string>(getComponentList())
    for (const meta of COMPONENT_CATALOG) {
      expect(libraryTypes.has(meta.type)).toBe(true)
      expect(getComponent(meta.type as Parameters<typeof getComponent>[0])).toBeDefined()
    }
  })

  it('uses known categories only', () => {
    const ids = new Set(COMPONENT_CATEGORIES.map((c) => c.id))
    for (const meta of COMPONENT_CATALOG) {
      expect(ids.has(meta.category)).toBe(true)
    }
  })

  it('has unique types', () => {
    const types = COMPONENT_CATALOG.map((m) => m.type)
    expect(new Set(types).size).toBe(types.length)
  })
})

describe('getCatalogByCategory', () => {
  it('groups basic components', () => {
    const types = getCatalogByCategory('basic').map((m) => m.type)
    expect(types).toContain('Button')
    expect(types).toContain('Input')
    expect(types).toContain('Card')
  })
})

describe('searchCatalog', () => {
  it('returns everything on empty query', () => {
    expect(searchCatalog('').length).toBe(COMPONENT_CATALOG.length)
    expect(searchCatalog('   ').length).toBe(COMPONENT_CATALOG.length)
  })

  it('matches type, label, and description case-insensitively', () => {
    expect(searchCatalog('button').map((m) => m.type)).toContain('Button')
    expect(searchCatalog('NAVIGATION').map((m) => m.type)).toContain('Navbar')
    expect(searchCatalog('sortable').map((m) => m.type)).toContain('Table')
  })

  it('returns empty for no match', () => {
    expect(searchCatalog('zzz-no-such-component')).toEqual([])
  })
})
