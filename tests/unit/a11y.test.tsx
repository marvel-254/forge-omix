import { describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import axe from 'axe-core'
import { EditorShell } from '@client/app/EditorShell'
import { MemoryRouter } from 'react-router-dom'
import { useSchemaStore } from '@client/store/schemaStore'

/**
 * Phase 12 accessibility audit (docs/13 §13.4.6): axe-core over the
 * server-rendered shell in onboarding and project states. jsdom cannot
 * compute styles, so color-contrast and document-level rules (lang/title)
 * are excluded — those need the Playwright pass.
 */

const DISABLED = ['color-contrast', 'html-has-lang', 'document-title', 'meta-viewport']

async function auditCurrentShell(): Promise<string[]> {
  document.documentElement.innerHTML = ''
  document.body.innerHTML = renderToString(<MemoryRouter><EditorShell /></MemoryRouter>)
  const results = await axe.run(document, {
    rules: Object.fromEntries(DISABLED.map((id) => [id, { enabled: false }])),
  })
  return results.violations.map(
    (v) => `${v.id} (${v.nodes.length}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`
  )
}

function seedProject() {
  useSchemaStore.setState({
    project: {
      id: 'proj_a11ytest',
      name: 'A11y Project',
      version: '1.0.0',
      pages: [
        {
          id: 'page_home',
          path: '/',
          title: 'Home',
          components: [
            { id: 'comp_btn1', type: 'Button', props: { label: 'Go' } },
            { id: 'comp_input1', type: 'Input', props: { label: 'Name' } },
          ],
        },
      ],
      components: [],
    } as never,
    activePageId: 'page_home',
    selectedIds: new Set<string>(['comp_btn1']),
    canvasRevision: 0,
  })
}

describe('axe audit', () => {
  beforeEach(() => {
    useSchemaStore.setState({ project: null, activePageId: null, selectedIds: new Set<string>() })
  })

  it('onboarding has no critical violations', async () => {
    // Puck renders nothing without a project; audit the shell chrome.
    const violations = await auditCurrentShell()
    expect(violations).toEqual([])
  }, 30000)

  it('project shell has no critical violations', async () => {
    seedProject()
    const violations = await auditCurrentShell()
    expect(violations).toEqual([])
  }, 30000)
})
