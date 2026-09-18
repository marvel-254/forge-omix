import { describe, it, expect } from 'vitest'
import {
  componentsToPuckContent,
  puckContentToComponents,
  OMIX_META_KEY,
} from '@/client/canvas/puckBridge'
import type { Component } from '@/client/types/schema'

const fullComponent = {
  id: 'comp_a1',
  type: 'Button',
  name: 'Submit',
  props: { label: 'Go', variant: 'primary' },
  children: [{ id: 'comp_b2', type: 'Text', props: { text: 'hi' } }],
  styles: { base: { color: 'red' } },
  interactions: { onClick: { type: 'navigate', target: '/home' } },
  responsive: [{ breakpoint: 'md', props: { size: 'lg' } }],
  accessibility: { role: 'button', label: 'Submit' },
  version: '1.0.0',
} as unknown as Component

describe('puckBridge metadata round-trip', () => {
  it('carries non-prop fields through Puck content opaquely', () => {
    const content = componentsToPuckContent([fullComponent])
    const props = content[0].props as Record<string, unknown>
    expect(props.id).toBe('comp_a1')
    expect(props.label).toBe('Go')
    const meta = props[OMIX_META_KEY] as Record<string, unknown>
    expect(meta.name).toBe('Submit')
    expect(meta.children).toEqual(fullComponent.children)
    expect(meta.styles).toEqual(fullComponent.styles)
    expect(meta.version).toBe('1.0.0')
  })

  it('restores metadata and strips bridge keys on the way out', () => {
    const back = puckContentToComponents(componentsToPuckContent([fullComponent]))
    expect(back).toHaveLength(1)
    const restored = back[0] as unknown as Record<string, unknown>
    expect(restored.id).toBe('comp_a1')
    expect(restored.type).toBe('Button')
    expect(restored.name).toBe('Submit')
    expect(restored.children).toEqual(fullComponent.children)
    expect(restored.styles).toEqual(fullComponent.styles)
    expect(restored.interactions).toEqual(fullComponent.interactions)
    expect(restored.responsive).toEqual(fullComponent.responsive)
    expect(restored.accessibility).toEqual(fullComponent.accessibility)
    expect(restored.version).toBe('1.0.0')
    const props = restored.props as Record<string, unknown>
    expect(props).toEqual({ label: 'Go', variant: 'primary' })
    expect('id' in props).toBe(false)
    expect(OMIX_META_KEY in props).toBe(false)
  })

  it('preserves metadata across a simulated Puck prop edit', () => {
    const content = componentsToPuckContent([fullComponent])
    // Simulate Puck applying a field edit: same items, changed props.
    const edited = content.map((item) => ({
      ...item,
      props: { ...(item.props as Record<string, unknown>), label: 'Edited' },
    }))
    const back = puckContentToComponents(edited)
    const restored = back[0] as unknown as Record<string, unknown>
    expect((restored.props as Record<string, unknown>).label).toBe('Edited')
    expect(restored.name).toBe('Submit')
    expect(restored.children).toEqual(fullComponent.children)
  })

  it('prefers store-side metadata over the stale Puck-carried copy', () => {
    const content = componentsToPuckContent([fullComponent])
    // Panel renames the component without remounting Puck: the mounted
    // copy still carries the old name under __omix.
    const prevById = new Map([
      ['comp_a1', { ...fullComponent, name: 'Renamed in panel' } as unknown as Component],
    ])
    const back = puckContentToComponents(content, prevById)
    const restored = back[0] as unknown as Record<string, unknown>
    expect(restored.name).toBe('Renamed in panel')
    expect((restored.props as Record<string, unknown>).label).toBe('Go')
  })

  it('falls back to the Puck-carried copy for components unknown to the store', () => {
    const content = componentsToPuckContent([fullComponent])
    const back = puckContentToComponents(content, new Map())
    expect((back[0] as unknown as Record<string, unknown>).name).toBe('Submit')
  })

  it('omits the meta key when a component has no extra fields', () => {
    const plain = { id: 'comp_c3', type: 'Card', props: {} } as unknown as Component
    const content = componentsToPuckContent([plain])
    expect(OMIX_META_KEY in (content[0].props as Record<string, unknown>)).toBe(false)
    expect(puckContentToComponents(content)).toHaveLength(1)
  })

  it('defaults missing ids to comp_unknown and handles empty content', () => {
    const back = puckContentToComponents([{ type: 'Button', props: {} }] as never)
    expect(back[0].id).toBe('comp_unknown')
    expect(puckContentToComponents(undefined)).toEqual([])
    expect(puckContentToComponents([])).toEqual([])
  })
})
