import { describe, it, expect } from 'vitest'
import { buildTokenCssVars } from '../../src/client/canvas/themeVars'

/**
 * Shadow design tokens map onto the --omix-shadow-N vars consumed by the
 * Card elevation preset chips and the canvas Card renderer, so chips preview
 * and canvas paint the same shadows.
 */
describe('buildTokenCssVars shadows', () => {
  it('maps sm/md/lg shadow tokens to elevation vars 1/2/3', () => {
    const vars = buildTokenCssVars({
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.2)',
        md: '0 4px 6px rgba(0,0,0,0.2)',
        lg: '0 10px 15px rgba(0,0,0,0.2)',
      },
    })
    expect(vars['--omix-shadow-1']).toBe('0 1px 2px rgba(0,0,0,0.2)')
    expect(vars['--omix-shadow-2']).toBe('0 4px 6px rgba(0,0,0,0.2)')
    expect(vars['--omix-shadow-3']).toBe('0 10px 15px rgba(0,0,0,0.2)')
  })

  it('skips missing and non-string shadow tokens', () => {
    const vars = buildTokenCssVars({ shadows: { sm: 42, lg: '   ' } })
    expect(vars['--omix-shadow-1']).toBeUndefined()
    expect(vars['--omix-shadow-3']).toBeUndefined()
  })

  it('rejects shadow values containing unsafe characters', () => {
    const vars = buildTokenCssVars({ shadows: { md: '0 0 {evil}' } })
    expect(vars['--omix-shadow-2']).toBeUndefined()
  })

  it('keeps elevation vars absent when no shadows token exists', () => {
    expect(buildTokenCssVars({ colors: { primary: '#2563eb' } })['--omix-shadow-2']).toBeUndefined()
  })
})
