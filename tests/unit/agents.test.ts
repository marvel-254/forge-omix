import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('AGENTS.md', () => {
  it('contains required sections', () => {
    const agentsMd = readFileSync(join(process.cwd(), 'AGENTS.md'), 'utf-8')
    
    expect(agentsMd).toContain('# Project:')
    expect(agentsMd).toContain('## Overview')
    expect(agentsMd).toContain('## Architecture')
    expect(agentsMd).toContain('## Tasks')
    expect(agentsMd).toContain('## Component Specifications')
    expect(agentsMd).toContain('## API Expectations')
    expect(agentsMd).toContain('## Testing Requirements')
    expect(agentsMd).toContain('## Files to NEVER Modify')
    expect(agentsMd).toContain('## Sync Rules')
  })
})
