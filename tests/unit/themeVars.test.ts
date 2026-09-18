import { describe, it, expect } from 'vitest'
import {
  buildTokenCssVars,
  normalizeColor,
  hexToRgbTriplet,
} from '@client/canvas/themeVars'

/**
 * Unit tests for the token → CSS-variable theming bridge that rethemes the
 * whole canvas (all UI-kit components) from project designTokens.
 */
describe('normalizeColor', () => {
  it('normalizes 6- and 3-digit hex', () => {
    expect(normalizeColor('#FF5733')).toBe('#ff5733')
    expect(normalizeColor('#f53')).toBe('#ff5533')
  })

  it('parses rgb()/rgba() strings', () => {
    expect(normalizeColor('rgb(249, 115, 22)')).toBe('#f97316')
    expect(normalizeColor('rgba(255,0,0,0.5)')).toBe('#ff0000')
  })

  it('rejects non-colors', () => {
    expect(normalizeColor('var(--x)')).toBeNull()
    expect(normalizeColor(42)).toBeNull()
    expect(normalizeColor(undefined)).toBeNull()
    expect(normalizeColor('  ')).toBeNull()
  })
})

describe('hexToRgbTriplet', () => {
  it('splits hex into an r g b triplet', () => {
    expect(hexToRgbTriplet('#f97316')).toEqual([249, 115, 22])
    expect(hexToRgbTriplet('#000000')).toEqual([0, 0, 0])
    expect(hexToRgbTriplet('#ffffff')).toEqual([255, 255, 255])
  })
})

describe('buildTokenCssVars', () => {
  it('returns {} for missing/non-object tokens', () => {
    expect(buildTokenCssVars(undefined)).toEqual({})
    expect(buildTokenCssVars(null)).toEqual({})
    expect(buildTokenCssVars('x')).toEqual({})
  })

  it('maps token color roles onto shadcn variables (and foregrounds)', () => {
    const vars = buildTokenCssVars({
      colors: {
        primary: '#f97316',
        surface: '#1e293b',
        error: '#dc2626',
      },
    })
    expect(vars['--primary']).toBe('249 115 22')
    expect(vars['--ring']).toBe('249 115 22')
    expect(vars['--primary-foreground']).toBe('255 255 255')
    expect(vars['--card']).toBe('30 41 59')
    expect(vars['--destructive']).toBe('220 38 38')
  })

  it('maps border/background and text roles', () => {
    const vars = buildTokenCssVars({
      colors: {
        background: '#0f172a',
        border: 'rgb(51,65,85)',
        text: { primary: '#e2e8f0', secondary: '#94a3b8' },
      },
    })
    expect(vars['--background']).toBe('15 23 42')
    expect(vars['--border']).toBe('51 65 85')
    expect(vars['--input']).toBe('51 65 85')
    expect(vars['--foreground']).toBe('226 232 240')
    expect(vars['--muted-foreground']).toBe('148 163 184')
  })

  it('keeps defaults for roles not provided (no override emitted)', () => {
    const vars = buildTokenCssVars({ colors: { primary: '#f97316' } })
    expect(Object.keys(vars)).toEqual(
      expect.arrayContaining(['--primary', '--ring', '--primary-foreground'])
    )
    expect(vars['--background']).toBeUndefined()
    expect(vars['--card']).toBeUndefined()
  })

  it('ignores invalid color values instead of emitting them', () => {
    const vars = buildTokenCssVars({ colors: { primary: 'var(--nope)', error: 42 } })
    expect(vars['--primary']).toBeUndefined()
    expect(vars['--destructive']).toBeUndefined()
  })

  it('passes through a typography fontFamily token', () => {
    const vars = buildTokenCssVars({ typography: { fontFamily: 'Georgia, serif' } })
    expect(vars['--omix-font-family']).toBe('Georgia, serif')
  })
})
