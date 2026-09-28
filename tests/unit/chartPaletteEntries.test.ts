import { describe, it, expect } from 'vitest'
import { deriveChartPaletteEntries, deriveChartPalette } from '../../src/client/canvas/registry'

/**
 * deriveChartPaletteEntries backs the token preset swatches in the color
 * picker: each entry must carry its design-token role (for the tooltip /
 * aria-label) and a valid CSS color value, in canonical series order.
 */
describe('deriveChartPaletteEntries', () => {
  it('returns role+value entries in canonical series order', () => {
    const entries = deriveChartPaletteEntries({
      primary: '#2563eb',
      success: '#10b981',
      error: '#ef4444',
    })
    expect(entries.map((e) => e.role)).toEqual(['primary', 'success', 'error'])
    expect(entries.map((e) => e.value)).toEqual(['#2563eb', '#10b981', '#ef4444'])
  })

  it('skips invalid and non-color values, keeping the role gap closed', () => {
    const entries = deriveChartPaletteEntries({
      primary: 'var(--x)',
      success: '   ',
      warning: 'rgb(20, 184, 166)',
      error: 42,
    })
    expect(entries).toEqual([
      { role: 'warning', value: 'rgb(20, 184, 166)' },
    ])
  })

  it('returns empty for null/non-object input', () => {
    expect(deriveChartPaletteEntries(null)).toEqual([])
    expect(deriveChartPaletteEntries('nope')).toEqual([])
  })

  it('deriveChartPalette still returns bare values (existing consumers)', () => {
    expect(deriveChartPalette({ primary: '#2563eb', accent: 'var(--x)' })).toEqual(['#2563eb'])
  })
})
