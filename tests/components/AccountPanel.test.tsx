import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountPanel } from '@client/components/account/AccountPanel'
import { accountApi, ApiError, authApi, type AccountOverview } from '@client/lib/api'

const overview: AccountOverview = {
  account: {
    id: 'account-1',
    email: 'person@example.com',
    displayName: 'Person',
    role: 'user',
  },
  projects: [
    {
      id: 'project-1',
      name: 'First project',
      description: 'A project description',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deploymentCount: 2,
      domainCount: 1,
    },
  ],
  totals: { projects: 1, deployments: 2, domains: 1 },
}

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

function button(container: HTMLElement, text: string): HTMLButtonElement {
  const match = Array.from(container.querySelectorAll('button')).find(
    (item) => item.textContent?.trim() === text
  )
  if (!match) throw new Error(`Button not found: ${text}`)
  return match
}

describe('AccountPanel', () => {
  let container: HTMLDivElement
  let root: Root

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterAll(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = false
  })

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    vi.restoreAllMocks()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('shows an accessible loading state while loading the overview', () => {
    vi.spyOn(accountApi, 'getOverview').mockReturnValue(new Promise(() => {}))

    act(() => root.render(<AccountPanel isOpen onClose={() => {}} onOpenProject={() => {}} onShowPlans={() => {}} />))

    expect(container.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true')
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Loading account overview')
  })

  it('loads profile and totals and opens the selected project', async () => {
    vi.spyOn(accountApi, 'getOverview').mockResolvedValue(overview)
    const onClose = vi.fn()
    const onOpenProject = vi.fn()

    act(() => root.render(<AccountPanel isOpen onClose={onClose} onOpenProject={onOpenProject} onShowPlans={() => {}} />))
    await flush()

    expect(container.textContent).toContain('Person')
    expect(container.textContent).toContain('person@example.com')
    expect(container.textContent).toContain('First project')
    expect(container.textContent).toContain('2 deployments · 1 domain')

    await act(async () => button(container, 'Open').click())

    expect(onClose).toHaveBeenCalledOnce()
    expect(onOpenProject).toHaveBeenCalledWith('project-1')
  })

  it('opens plans from the account panel', async () => {
    vi.spyOn(accountApi, 'getOverview').mockResolvedValue(overview)
    const onClose = vi.fn()
    const onShowPlans = vi.fn()

    act(() => root.render(<AccountPanel isOpen onClose={onClose} onOpenProject={() => {}} onShowPlans={onShowPlans} />))
    await flush()

    await act(async () => button(container, 'Plans').click())

    expect(onClose).toHaveBeenCalledOnce()
    expect(onShowPlans).toHaveBeenCalledOnce()
  })

  it('logs out and follows the provided post-logout path', async () => {
    vi.spyOn(accountApi, 'getOverview').mockResolvedValue(overview)
    vi.spyOn(authApi, 'logout').mockResolvedValue({ loggedOut: true })
    const onLoggedOut = vi.fn()

    act(() => root.render(<AccountPanel isOpen onClose={() => {}} onOpenProject={() => {}} onShowPlans={() => {}} onLoggedOut={onLoggedOut} />))
    await flush()

    await act(async () => button(container, 'Sign out').click())
    await flush()

    expect(authApi.logout).toHaveBeenCalledOnce()
    expect(onLoggedOut).toHaveBeenCalledOnce()
  })

  it('exposes empty and API error states accessibly', async () => {
    vi.spyOn(accountApi, 'getOverview')
      .mockResolvedValueOnce({ ...overview, projects: [], totals: { projects: 0, deployments: 0, domains: 0 } })
      .mockRejectedValueOnce(new ApiError('Account unavailable', 503, 'ACCOUNT_UNAVAILABLE'))

    act(() => root.render(<AccountPanel isOpen onClose={() => {}} onOpenProject={() => {}} onShowPlans={() => {}} />))
    await flush()
    expect(container.querySelector('[role="status"]')?.textContent).toContain('No projects yet')

    act(() => root.unmount())
    root = createRoot(container)
    act(() => root.render(<AccountPanel isOpen onClose={() => {}} onOpenProject={() => {}} onShowPlans={() => {}} />))
    await flush()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Account unavailable')
    expect(button(container, 'Try again')).toBeDefined()
  })
})
