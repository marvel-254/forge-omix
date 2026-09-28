// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { createRoot, type Root } from 'react-dom/client'

// Fill in the registry import if missing
let container: HTMLDivElement | null = null
let root: Root | null = null

async function renderField(value: string) {
  const mod = await import('../../src/client/canvas/registry')
  const ColorSwatchField = (mod as unknown as { ColorSwatchField?: React.FC }).ColorSwatchField
  if (!ColorSwatchField) throw new Error('ColorSwatchField not exported')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await new Promise<void>((resolve) => {
    root!.render(
      React.createElement(ColorSwatchField, {
        value,
        onChange: (v: string) => {
          container!.setAttribute('data-last-change', v)
        },
      })
    )
    setTimeout(resolve, 0)
  })
}

afterEach(() => {
  root?.unmount()
  container?.remove()
  container = null
  root = null
})

describe('ColorSwatchField (component)', () => {
  it('renders the swatch chip, current hex value, and hidden native color input', async () => {
    await renderField('#f97316')
    const field = container!.querySelector('[data-testid="color-swatch-field"]')
    expect(field).not.toBeNull()
    expect(field!.querySelector('input[type="color"]')?.getAttribute('value')).toBe('#f97316')
    expect(field!.textContent).toContain('#f97316')
    // A set color shows a clear action
    expect(field!.querySelector('button[aria-label="Clear color"]')).not.toBeNull()
  })

  it('shows the inherit (empty) state with no clear action', async () => {
    await renderField('')
    const field = container!.querySelector('[data-testid="color-swatch-field"]')!
    expect(field.textContent).toContain('Inherit')
    expect(field.querySelector('button[aria-label="Clear color"]')).toBeNull()
    // Empty value must not echo a bogus hex
    expect(field.textContent).not.toMatch(/#[0-9a-f]{6}/)
  })

  it('clear button fires onChange with an empty string', async () => {
    await renderField('#10b981')
    const clear = container!.querySelector('button[aria-label="Clear color"]') as HTMLButtonElement
    expect(clear).not.toBeNull()
    clear.click()
    expect(container!.getAttribute('data-last-change')).toBe('')
  })
})
