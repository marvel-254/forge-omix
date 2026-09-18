import { describe, it, expect } from 'vitest'
import {
  presentComponent,
  resolveRefValue,
  resolveStyleRefs,
  VIEWPORT_BREAKPOINT,
} from '@/client/canvas/presentation'
import type { Component, DesignTokens } from '@/client/types/schema'

const tokens = {
  colors: { primary: '#3B82F6' },
} as unknown as DesignTokens

const base = {
  id: 'comp_x1',
  type: 'Button',
  props: { label: 'Go', size: 'md' },
} as unknown as Component

describe('VIEWPORT_BREAKPOINT', () => {
  it('maps simulator viewports to representative schema breakpoints', () => {
    expect(VIEWPORT_BREAKPOINT.mobile).toBe('sm')
    expect(VIEWPORT_BREAKPOINT.tablet).toBe('md')
    expect(VIEWPORT_BREAKPOINT.desktop).toBe('lg')
  })
})

describe('resolveRefValue', () => {
  it('resolves design-token pointers', () => {
    expect(resolveRefValue({ $ref: 'designTokens.colors.primary' }, tokens)).toBe('#3B82F6')
  })

  it('leaves unresolvable pointers in place', () => {
    const ref = { $ref: 'designTokens.colors.nope' }
    expect(resolveRefValue(ref, tokens)).toBe(ref)
  })

  it('passes plain values through', () => {
    expect(resolveRefValue('red', tokens)).toBe('red')
    expect(resolveRefValue(12, tokens)).toBe(12)
    expect(resolveRefValue({ $ref: 'x' }, null)).toEqual({ $ref: 'x' })
  })
})

describe('resolveStyleRefs', () => {
  it('resolves refs and converts kebab-case to camelCase', () => {
    expect(
      resolveStyleRefs(
        { 'background-color': { $ref: 'designTokens.colors.primary' }, margin: '8px' },
        tokens
      )
    ).toEqual({ backgroundColor: '#3B82F6', margin: '8px' })
  })

  it('drops non-string/number values', () => {
    expect(resolveStyleRefs({ padding: { nested: true } }, tokens)).toEqual({})
    expect(resolveStyleRefs(undefined, tokens)).toEqual({})
  })
})

describe('presentComponent', () => {
  it('returns base props, no style, no a11y by default', () => {
    const pres = presentComponent(base, 'desktop', tokens)
    expect(pres.visible).toBe(true)
    expect(pres.props).toEqual({ label: 'Go', size: 'md' })
    expect(pres.style).toEqual({})
    expect(pres.a11y).toEqual({})
  })

  it('hides components with a matching hidden entry', () => {
    const comp = {
      ...base,
      responsive: [{ breakpoint: 'sm', hidden: true }],
    } as unknown as Component
    expect(presentComponent(comp, 'mobile', tokens).visible).toBe(false)
    expect(presentComponent(comp, 'desktop', tokens).visible).toBe(true)
  })

  it('applies matching-viewport prop overrides over base props', () => {
    const comp = {
      ...base,
      responsive: [{ breakpoint: 'lg', props: { size: 'lg' } }],
    } as unknown as Component
    const pres = presentComponent(comp, 'desktop', tokens)
    expect(pres.props).toEqual({ label: 'Go', size: 'lg' })
    expect(pres.overrides).toEqual({ size: 'lg' })
    // Other viewports are unaffected.
    expect(presentComponent(comp, 'mobile', tokens).props).toEqual({ label: 'Go', size: 'md' })
  })

  it('merges base styles and entry style overrides', () => {
    const comp = {
      ...base,
      styles: { base: { color: { $ref: 'designTokens.colors.primary' } } },
      responsive: [{ breakpoint: 'lg', styles: { 'font-size': '18px' } }],
    } as unknown as Component
    const pres = presentComponent(comp, 'desktop', tokens)
    expect(pres.style).toMatchObject({ color: '#3B82F6', fontSize: '18px' })
  })

  it('maps accessibility metadata to aria attributes', () => {
    const comp = {
      ...base,
      accessibility: { role: 'button', label: 'Submit', tabIndex: 0 },
    } as unknown as Component
    const pres = presentComponent(comp, 'desktop', tokens)
    expect(pres.a11y).toEqual({ role: 'button', 'aria-label': 'Submit', tabIndex: 0 })
  })
})
