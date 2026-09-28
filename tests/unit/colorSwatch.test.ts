import { describe, it, expect } from 'vitest'
import { normalizeToHex } from '../../src/client/canvas/registry'

/**
 * Unit tests for the hex normalization backing the dataset color swatch
 * picker: `<input type="color">` only accepts `#rrggbb`, so every format we
 * want picker-round-trippable must convert, and everything else must return
 * null (→ "inherit" swatch state).
 */
describe('normalizeToHex', () => {
  it('passes 6-digit hex through (lowercased)', () => {
    expect(normalizeToHex('#10B981')).toBe('#10b981')
    expect(normalizeToHex('  #2563eb ')).toBe('#2563eb')
  })

  it('expands 3-digit hex', () => {
    expect(normalizeToHex('#f97')).toBe('#ff9977')
    expect(normalizeToHex('#ABC')).toBe('#aabbcc')
  })

  it('converts rgb()/rgba() strings', () => {
    expect(normalizeToHex('rgb(249, 115, 22)')).toBe('#f97316')
    expect(normalizeToHex('rgba(16, 185, 129, 0.5)')).toBe('#10b981')
  })

  it('clamps rgb channels to 0-255', () => {
    expect(normalizeToHex('rgb(300, -5, 128)')).toBe('#ff0080')
  })

  it('returns null for non-colors and unsupported formats', () => {
    expect(normalizeToHex('var(--primary)')).toBeNull()
    expect(normalizeToHex('tok_$ref')).toBeNull()
    expect(normalizeToHex('hsl(210, 60%, 50%)')).toBeNull()
    expect(normalizeToHex('42')).toBeNull()
    expect(normalizeToHex('')).toBeNull()
    expect(normalizeToHex(null)).toBeNull()
    expect(normalizeToHex(undefined)).toBeNull()
    expect(normalizeToHex(123)).toBeNull()
  })
})
