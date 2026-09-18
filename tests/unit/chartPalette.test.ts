import { describe, it, expect } from 'vitest'
import { deriveChartPalette } from '@client/canvas/registry'

/**
 * Unit tests for the token-derived chart palette. The canvas registry feeds
 * project designTokens.colors through deriveChartPalette so chart series and
 * pie/doughnut slices follow the project theme; an empty result means the
 * Chart falls back to its built-in palette.
 */
describe('deriveChartPalette', () => {
  it('returns empty palette for missing/non-object tokens', () => {
    expect(deriveChartPalette(undefined)).toEqual([])
    expect(deriveChartPalette(null)).toEqual([])
    expect(deriveChartPalette('nope')).toEqual([])
    expect(deriveChartPalette(42)).toEqual([])
  })

  it('extracts colors in the canonical series order', () => {
    const palette = deriveChartPalette({
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#f97316',
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0ea5e9',
    })
    expect(palette).toEqual([
      '#2563eb', // primary
      '#16a34a', // success
      '#d97706', // warning
      '#dc2626', // error
      '#64748b', // secondary
      '#f97316', // accent
      '#0ea5e9', // info
    ])
  })

  it('skips undefined roles and keeps relative order', () => {
    const palette = deriveChartPalette({ primary: '#2563eb', error: '#dc2626' })
    expect(palette).toEqual(['#2563eb', '#dc2626'])
  })

  it('accepts hex, rgb, hsl, and keyword colors', () => {
    const palette = deriveChartPalette({
      primary: '#fff',
      success: 'rgb(16 163 74)',
      warning: 'hsl(38 92% 50%)',
      error: 'red',
    })
    expect(palette).toEqual(['#fff', 'rgb(16 163 74)', 'hsl(38 92% 50%)', 'red'])
  })

  it('rejects non-color values (css vars, numbers, garbage)', () => {
    const palette = deriveChartPalette({
      primary: 'var(--primary)',
      success: 12345,
      warning: '{}',
      error: '   ',
    })
    expect(palette).toEqual([])
  })

  it('trims whitespace around token values', () => {
    const palette = deriveChartPalette({ primary: '  #2563eb  ' })
    expect(palette).toEqual(['#2563eb'])
  })
})
