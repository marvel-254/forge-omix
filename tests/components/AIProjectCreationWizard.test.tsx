import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { act } from 'react'
import { Simulate } from 'react-dom/test-utils'
import { createRoot } from 'react-dom/client'
import { AIProjectCreationWizard } from '@client/components/ai/AIProjectCreationWizard'
import {
  buildAiProjectCreationResult,
  createInitialAiCreationState,
  type AiProjectCreationResult,
} from '@client/lib/aiCreation'

const generatedProject = buildAiProjectCreationResult(
  createInitialAiCreationState({ brief: 'A portfolio for a photographer' })
).project

function setValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  act(() => {
    setter?.call(element, value)
    Simulate.change(element, { target: { value } } as never)
  })
}

async function click(label: string) {
  const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent === label)
  expect(button).toBeDefined()
  await act(async () => {
    ;(button as HTMLButtonElement).click()
  })
}

function mountWizard(props: { initialSessionId?: string } = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const result: { value?: AiProjectCreationResult } = {}
  act(() => {
    root.render(
      <AIProjectCreationWizard
        onComplete={(value) => {
          result.value = value
          return { valid: true }
        }}
        onCancel={() => {}}
        {...props}
      />
    )
  })
  return { container, root, result }
}

function response(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function sessionFor(body: Record<string, unknown>, status: 'draft' | 'ready' = 'draft') {
  return {
    id: 'ai_server_session',
    status,
    step: body.step ?? 'brief',
    brief: String(body.brief ?? ''),
    projectName: String(body.projectName ?? ''),
    clarifications: body.clarifications ?? {},
    assets: body.assets ?? {},
    generatedProject: status === 'ready' ? generatedProject : null,
    error: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('AIProjectCreationWizard', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    let currentBody: Record<string, unknown> = {}
    fetchMock.mockImplementation(async (url: string, init: RequestInit = {}) => {
      const method = init.method ?? 'GET'
      const path = String(url)
      if (method === 'GET') {
        return response({ session: sessionFor({ brief: 'A resumed portfolio', step: 'review' }) })
      }
      const body = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
      currentBody = { ...currentBody, ...body }
      const status = path.endsWith('/generate') ? 'ready' : 'draft'
      return response({ session: sessionFor(currentBody, status) })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('captures a brief, persists each step, and emits the server-generated result', async () => {
    const { container, root, result } = mountWizard()
    expect(container.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true')
    expect(container.textContent).toContain('Describe what you want to build')

    setValue(container.querySelector('#ai-brief') as HTMLTextAreaElement, 'A portfolio for a photographer')
    await click('Continue')
    await vi.waitFor(() => expect(container.textContent).toContain('A few details'))

    setValue(container.querySelector('#ai-audience') as HTMLInputElement, 'photographers')
    setValue(container.querySelector('#ai-goal') as HTMLInputElement, 'book a portrait session')
    await click('Continue')
    await vi.waitFor(() => expect(container.textContent).toContain('Add brand assets'))

    setValue(container.querySelector('#ai-logo-name') as HTMLInputElement, 'mark.svg')
    await click('Continue')
    await vi.waitFor(() => expect(container.textContent).toContain('Normalized brief'))
    expect(container.textContent).toContain('book a portrait session')

    await click('Create project')
    await vi.waitFor(() => expect(result.value).toBeDefined())
    expect(result.value?.sessionId).toBe('ai_server_session')
    expect(result.value?.normalizedBrief.assets.logo?.name).toBe('mark.svg')
    expect(result.value?.project.name).toBe('A portfolio for a photographer')
    expect(container.textContent).toContain('Generated project ready.')
    expect(fetchMock.mock.calls.map(([, init]) => init.method)).toEqual([
      'POST',
      'PATCH',
      'PATCH',
      'PATCH',
      'PATCH',
      'POST',
    ])

    act(() => root.unmount())
    container.remove()
  })

  it('keeps the local starter and error when the server is unavailable', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    const { container, root, result } = mountWizard()
    setValue(container.querySelector('#ai-brief') as HTMLTextAreaElement, 'An offline project')
    await click('Continue')
    await vi.waitFor(() => expect(container.textContent).toContain('A few details'))
    await click('Continue')
    await vi.waitFor(() => expect(container.textContent).toContain('Add brand assets'))
    await click('Continue')
    await vi.waitFor(() => expect(container.textContent).toContain('Normalized brief'))
    await click('Create project')

    await vi.waitFor(() => expect(result.value).toBeDefined())
    expect(result.value?.project.name).toBe('An offline project')
    expect(container.textContent).toContain('Local starter project ready.')
    expect(container.textContent).toContain('offline')

    act(() => root.unmount())
    container.remove()
  })

  it('resumes a brief after going back and reloads a session by id', async () => {
    const { container, root } = mountWizard()
    setValue(container.querySelector('#ai-brief') as HTMLTextAreaElement, 'A calm portfolio')
    await click('Continue')
    await click('Back')

    expect((container.querySelector('#ai-brief') as HTMLTextAreaElement).value).toBe('A calm portfolio')
    expect(container.textContent).toContain('Describe what you want to build')

    act(() => root.unmount())
    container.remove()

    const resumed = mountWizard({ initialSessionId: 'ai_server_session' })
    await vi.waitFor(() => expect(resumed.container.textContent).toContain('Normalized brief'))
    expect(resumed.container.textContent).toContain('A resumed portfolio')
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/ai/creation/sessions/ai_server_session',
      expect.objectContaining({ credentials: 'include' })
    )

    act(() => resumed.root.unmount())
    resumed.container.remove()
  })
})
