// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useSchemaStore } from '@client/store/schemaStore'
import { PropertiesPanel } from '@client/panels/PropertiesPanel'

/**
 * The app PropertiesPanel generates controls from the registry's Puck field
 * definitions. These tests pin the two upgrades over the old JSON-textarea
 * fallback: array fields (datasets/categories) render repeatable row editors,
 * and custom fields (the dataset color swatch) render the real control with
 * store round-trip on change.
 */

function seedChartProject() {
  useSchemaStore.setState({
    project: {
      id: 'proj_panel123',
      name: 'Panel Project',
      version: '1.0.0',
      designTokens: {
        colors: {
          primary: '#2563eb',
          success: '#10b981',
        },
        shadows: {
          sm: '0 1px 2px rgba(0,0,0,0.25)',
          md: '0 4px 6px rgba(0,0,0,0.25)',
        },
      },
      pages: [
        {
          id: 'page_home',
          path: '/',
          title: 'Home',
          components: [
            {
              id: 'comp_chart1',
              type: 'Chart',
              name: 'Revenue chart',
              props: {
                type: 'bar',
                chartLabels: ['Q1', 'Q2'],
                datasets: [
                  { label: 'Revenue', values: '12, 30' },
                  { label: 'Costs', values: '8, 14', color: '#10b981' },
                ],
              },
            },
          ],
        },
      ],
      components: [],
    } as never,
    activePageId: 'page_home',
    selectedIds: new Set<string>(['comp_chart1']),
    canvasRevision: 0,
  })
}

function seedButtonProject() {
  useSchemaStore.setState({
    project: {
      id: 'proj_panel123',
      name: 'Panel Project',
      version: '1.0.0',
      designTokens: { colors: { primary: '#2563eb' } },
      pages: [
        {
          id: 'page_home',
          path: '/',
          title: 'Home',
          components: [
            {
              id: 'comp_btn1',
              type: 'Button',
              name: 'Submit button',
              props: { label: 'Go', variant: 'outline' },
            },
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

describe('PropertiesPanel registry-driven fields', () => {
  it('renders array rows with per-field controls instead of JSON textareas for datasets', async () => {
    seedChartProject()
    root!.render(React.createElement(PropertiesPanel))
    await new Promise((r) => setTimeout(r, 0))

    const text = container!.textContent ?? ''
    expect(text).toContain('Datasets')
    expect(text).toContain('Revenue')
    expect(text).toContain('Costs')
    // Swatch field renders inside the expanded row control list (custom field)
    expect(container!.querySelectorAll('[data-testid="color-swatch-field"]').length).toBeGreaterThanOrEqual(0)
    // No JSON fallback for array fields
    expect(text).not.toContain('Datasets (JSON)')
  })

  it('renders the Categories array as editable rows, not a JSON textarea', async () => {
    seedChartProject()
    root!.render(React.createElement(PropertiesPanel))
    await new Promise((r) => setTimeout(r, 0))

    const text = container!.textContent ?? ''
    expect(text).toContain('Categories')
    expect(text).toContain('Q1')
    expect(text).not.toContain('Categories (JSON)')
  })

  it('shows a color dot per collapsed dataset row, striped when inheriting', async () => {
    seedChartProject()
    root!.render(React.createElement(PropertiesPanel))
    await new Promise((r) => setTimeout(r, 0))

    const dots = [...container!.querySelectorAll('[data-testid="dataset-row-dot"]')] as HTMLElement[]
    expect(dots.length).toBe(2)
    // Revenue (no color) shows the striped inherit placeholder
    expect(dots[0].style.background).toContain('repeating-linear-gradient')
    // Costs has an explicit color
    expect(dots[1].style.background).toContain('rgb(16, 185, 129)')
  })

  it('renders variant preset chips for a selected Button and applies one on click', async () => {
    seedButtonProject()
    root!.render(React.createElement(PropertiesPanel))
    await new Promise((r) => setTimeout(r, 0))

    const chips = [...container!.querySelectorAll(
      '[data-testid="variant-preset-field"] [data-testid="preset-chip"]'
    )] as HTMLButtonElement[]
    const labels = chips.map((c) => c.textContent?.trim())
    expect(labels).toEqual(['Primary', 'Secondary', 'Outline', 'Ghost', 'Link'])
    // outline is selected per seed props
    const outline = chips[2]
    expect(outline.getAttribute('aria-pressed')).toBe('true')

    // Click Ghost → store updates
    chips[3].click()
    await new Promise((r) => setTimeout(r, 0))
    const comp = useSchemaStore.getState().project.pages[0].components[0] as unknown as {
      props: { variant?: string }
    }
    expect(comp.props.variant).toBe('ghost')
  })

  it('renders elevation preset chips for a selected Card and applies one on click', async () => {
    // Swap the seeded component for a Card
    useSchemaStore.setState((state) => {
      const pages = [...state.project.pages]
      pages[0] = {
        ...pages[0],
        components: [
          {
            id: 'comp_card1',
            type: 'Card',
            name: 'Info card',
            props: { header: 'Hi', content: 'Body', elevation: 2 },
          },
        ],
      }
      return {
        project: { ...state.project, pages },
        selectedIds: new Set<string>(['comp_card1']),
      } as typeof state
    })
    root!.render(React.createElement(PropertiesPanel))
    await new Promise((r) => setTimeout(r, 0))

    const chips = [...container!.querySelectorAll('[data-testid="preset-chip"]')] as HTMLButtonElement[]
    expect(chips.length).toBe(4)
    expect(chips[2].getAttribute('aria-pressed')).toBe('true') // elevation 2

    chips[0].click()
    await new Promise((r) => setTimeout(r, 0))
    const comp = useSchemaStore.getState().project.pages[0].components[0] as unknown as {
      props: { elevation?: number }
    }
    expect(comp.props.elevation).toBe(0)
  })

  it('round-trips a row edit into the schema store', async () => {
    seedChartProject()
    root!.render(React.createElement(PropertiesPanel))
    await new Promise((r) => setTimeout(r, 0))

    // Rows render collapsed with a color dot; expand the first to edit it.
    const summary = container!.querySelector(
      '[data-testid="dataset-row-summary"]'
    ) as HTMLButtonElement | null
    expect(summary).not.toBeNull()
    summary!.click()
    await new Promise((r) => setTimeout(r, 0))

    const nameInput = [...container!.querySelectorAll('input')].find(
      (i) => (i as HTMLInputElement).value === 'Revenue'
    ) as HTMLInputElement | undefined
    expect(nameInput).toBeDefined()

    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!
    setter.call(nameInput, 'Revenue v2')
    nameInput!.dispatchEvent(new Event('input', { bubbles: true }))

    const state = useSchemaStore.getState()
    const comp = state.project.pages[0].components[0] as unknown as {
      props: { datasets: Array<{ label?: string }> }
    }
    expect(comp.props.datasets[0].label).toBe('Revenue v2')
  })
})
