import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { EditorShell } from '@client/app/EditorShell'
import { useSchemaStore } from '@client/store/schemaStore'

/**
 * Smoke-render tests: mount the editor shell in jsdom.
 * - Empty state renders the onboarding actions
 * - "Create new project" seeds the store and renders the shell chrome
 *
 * jsdom lacks browser APIs Puck/dnd-kit rely on; stub the ones needed
 * for a plain mount without user interactions on the canvas.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  ;(globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub
  ;(globalThis as Record<string, unknown>).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  if (!window.matchMedia) {
    ;(window as unknown as { matchMedia: () => unknown }).matchMedia = () => ({
      matches: false,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    })
  }
})

beforeEach(() => {
  // Reset store to the no-project state
  useSchemaStore.setState({
    project: null,
    activePageId: null,
    selectedIds: new Set<string>(),
    canvasRevision: 0,
  })
})

describe('EditorShell (smoke render)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  it('renders the onboarding empty state when no project is loaded', () => {
    act(() => {
      root.render(<EditorShell />)
    })
    expect(container.textContent).toContain('forge@omix')
    expect(container.textContent).toContain('Create new project')
    expect(container.textContent).toContain('Import JSON')
  })

  it('creates a project from the empty state and renders the shell', () => {
    act(() => {
      root.render(<EditorShell />)
    })

    const createButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Create new project'
    )
    expect(createButton).toBeDefined()

    act(() => {
      // React 18 delegates native events at the root, so a real DOM click
      // reaches the button's onClick without @testing-library.
      ;(createButton as HTMLButtonElement).click()
    })

    // Store was seeded
    const state = useSchemaStore.getState()
    expect(state.project).not.toBeNull()
    expect(state.project?.pages.length).toBeGreaterThan(0)
    expect(state.activePageId).toBe(state.project?.pages[0]?.id)

    // Shell chrome rendered
    expect(container.textContent).toContain('Pages')
    expect(container.textContent).toContain('Component Library')
    expect(container.textContent).toContain('Export')
    // Right-side panel tabs
    expect(container.textContent).toContain('properties')
    expect(container.textContent).toContain('layers')
  })

  it('shows the project name in the header after creation', () => {
    act(() => {
      useSchemaStore.getState().actions.createProject('My Custom Project')
    })
    act(() => {
      root.render(<EditorShell />)
    })
    expect(container.textContent).toContain('My Custom Project')
  })
})
