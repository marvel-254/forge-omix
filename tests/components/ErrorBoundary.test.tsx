import { describe, it, expect, afterEach, vi } from 'vitest'
import React, { useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { ErrorBoundary } from '@client/components/ui/ErrorBoundary'

/** Phase 13 beta: canvas crashes show recovery UI instead of a blank screen. */

let root: Root | null = null
let container: HTMLElement | null = null

function render(element: React.ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(element)
  })
  return container
}

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  container?.remove()
  root = null
  container = null
  vi.restoreAllMocks()
})

function Boom(): React.ReactElement {
  throw new Error('canvas exploded')
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    const html = render(
      <ErrorBoundary area="canvas">
        <p>fine</p>
      </ErrorBoundary>
    )
    expect(html.textContent).toContain('fine')
  })

  it('shows fallback UI and recovers on reset', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    let explode = true
    function Flaky(): React.ReactElement {
      if (explode) throw new Error('boom')
      return <p>recovered</p>
    }
    const html = render(
      <ErrorBoundary area="canvas">
        <Flaky />
      </ErrorBoundary>
    )
    expect(html.textContent).toContain('Something went wrong in the canvas')
    expect(html.textContent).toContain('Your project data is safe')

    explode = false
    const button = html.querySelector('button')
    expect(button?.textContent).toContain('Try again')
    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(html.textContent).toContain('recovered')
  })

  it('resets when keyed by page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const first = render(
      <ErrorBoundary area="canvas" key="page-a">
        <Boom />
      </ErrorBoundary>
    )
    expect(first.textContent).toContain('Something went wrong')
    // Remount (page switch) clears the error state.
    const second = render(
      <ErrorBoundary area="canvas" key="page-b">
        <p>other page</p>
      </ErrorBoundary>
    )
    expect(second.textContent).toContain('other page')
  })

  it('calls onReset when recovering', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onReset = vi.fn()
    let explode = true
    function Flaky(): React.ReactElement {
      if (explode) throw new Error('boom')
      return <p>ok</p>
    }
    const html = render(
      <ErrorBoundary area="canvas" onReset={onReset}>
        <Flaky />
      </ErrorBoundary>
    )
    explode = false
    act(() => {
      html.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
