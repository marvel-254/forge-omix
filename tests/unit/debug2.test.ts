import { describe, it, expect } from 'vitest'
import { DesignTokensSchema } from '@server/validation'

describe('debug tokens', () => {
  it('tokens', () => {
    const data = {
      colors: { primary: '#fff' },
      motion: { keyframes: { fadeIn: { '0%': { opacity: '0' } } } },
    }
    const r = DesignTokensSchema.safeParse(data)
    if (!r.success) {
      console.log(JSON.stringify(r.error.issues, null, 2))
    }
    expect(r.success).toBe(true)
  })
})
