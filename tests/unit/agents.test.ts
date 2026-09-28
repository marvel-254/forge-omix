import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('AGENTS.md', () => {
  it('contains required sections', () => {
    const agentsMd = readFileSync(join(process.cwd(), 'AGENTS.md'), 'utf-8')
    
    expect(agentsMd).toContain('# forge@omix — Agent Guide')
    expect(agentsMd).toContain('## Project shape')
    expect(agentsMd).toContain('## Commands')
    expect(agentsMd).toContain('## Runtime and tests')
    expect(agentsMd).toContain('## Code and API contracts')
    expect(agentsMd).toContain('## Repository hygiene')
  })
})
