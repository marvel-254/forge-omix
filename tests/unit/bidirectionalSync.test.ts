// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useSchemaStore } from '@client/store/schemaStore'
import { TokensPanel } from '@client/panels/TokensPanel'
import { deriveChartPalette } from '@client/canvas/registry'

/**
 * Bidirectional sync + token editing:
 * - updateProjectFromCanvas (Puck → store) must NOT bump canvasRevision
 *   (no remount) but must still persist and validate.
 * - TokensPanel (store.designTokens editor) round-trips colors/shadows/
 *   typography into the store, which the canvas rethemes from.
 */

function seedProject() {
  useSchemaStore.setState({
    project: {
      id: 'proj_sync1234',
      name: 'Sync Project',
      version: '1.0.0',
      designTokens: {
        colors: { primary: '#2563eb', success: '#10b981' },
        shadows: { sm: '0 1px 2px rgba(0,0,0,0.2)' },
        typography: { fontFamily: { sans: 'Inter' } },
      },
      pages: [
        {
          id: 'page_home',
          path: '/',
          title: 'Home',
          components: [
            { id: 'comp_aaa1', type: 'Button', props: { label: 'A' } },
            { id: 'comp_bbb2', type: 'Button', props: { label: 'B' } },
          ],
        },
      ],
      components: [],
    } as never,
    activePageId: 'page_home',
    selectedIds: new Set<string>(),
    canvasRevision: 0,
  })
}

let container: HTMLDivElement | null = null
let root: Root | null = null

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  root?.unmount()
  container?.remove()
  container = null
  root = null
})

describe('updateProjectFromCanvas (Puck → store sync)', () => {
  it('updates the project without bumping canvasRevision', () => {
    seedProject()
    const before = useSchemaStore.getState().canvasRevision
    const project = useSchemaStore.getState().project
    const reordered = [...(project.pages[0].components as unknown[])]
    reordered.reverse()

    const result = useSchemaStore
      .getState()
      .actions.updateProjectFromCanvas({
        pages: [{ ...project.pages[0], components: reordered }],
      } as unknown as Record<string, unknown>)

    expect(result.valid).toBe(true)
    expect(useSchemaStore.getState().canvasRevision).toBe(before) // no remount
    const after = useSchemaStore.getState().project.pages[0].components
    expect(after[0].id).toBe('comp_bbb2') // drag applied
  })

  it('still rejects invalid patches', () => {
    seedProject()
    const result = useSchemaStore
      .getState()
      .actions.updateProjectFromCanvas({ pages: 'nope' } as unknown as Record<string, unknown>)
    expect(result.valid).toBe(false)
  })
})

describe('TokensPanel', () => {
  it('round-trips a color token edit into the store', async () => {
    seedProject()
    root!.render(React.createElement(TokensPanel))
    await new Promise((r) => setTimeout(r, 0))

    const primary = container!.querySelector(
      '[data-testid="token-color-primary"] input'
    ) as HTMLInputElement
    expect(primary.value).toBe('#2563eb')

    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!
    setter.call(primary, '#f97316')
    primary.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 0))

    const colors = useSchemaStore.getState().project.designTokens.colors as Record<string, string>
    expect(colors.primary).toBe('#f97316')
    // Other roles preserved
    expect(colors.success).toBe('#10b981')
  })

  it('clearing a token removes it (falls back to default)', async () => {
    seedProject()
    root!.render(React.createElement(TokensPanel))
    await new Promise((r) => setTimeout(r, 0))

    const primary = container!.querySelector(
      '[data-testid="token-color-primary"] input'
    ) as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!
    setter.call(primary, '')
    primary.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 0))

    const colors = useSchemaStore.getState().project.designTokens.colors as Record<string, string>
    expect(colors.primary).toBeUndefined()
    expect(colors.success).toBe('#10b981')
  })

  it('updates a shadow token', async () => {
    seedProject()
    root!.render(React.createElement(TokensPanel))
    await new Promise((r) => setTimeout(r, 0))

    const sm = container!.querySelector(
      '[data-testid="token-shadow-sm"] input'
    ) as HTMLInputElement | null
    expect(sm).not.toBeNull()
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!
    setter.call(sm, '0 9px 9px rgba(1,2,3,0.5)')
    sm.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 0))

    const shadows = useSchemaStore.getState().project.designTokens.shadows as Record<string, string>
    expect(shadows.sm).toBe('0 9px 9px rgba(1,2,3,0.5)')
  })

  it('charts derive their palette from the tokenized project (preview path)', () => {
    seedProject()
    const palette = deriveChartPalette(
      useSchemaStore.getState().project.designTokens.colors
    )
    expect(palette[0]).toBe('#2563eb')
  })
})
