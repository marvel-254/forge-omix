import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DomainPanel } from '@client/components/domains/DomainPanel'
import { ApiError, domainsApi, type Domain } from '@client/lib/api'

function makeDomain(overrides: Partial<Domain> = {}): Domain {
  return {
    id: 'domain-1',
    accountId: 'account-1',
    name: 'example.com',
    status: 'registered',
    registration: {
      ownership: 'unknown',
      status: 'not_registered',
      autoRenew: false,
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function inputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('DomainPanel', () => {
  let container: HTMLDivElement
  let root: Root
  let listMock: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    listMock = vi.spyOn(domainsApi, 'list').mockResolvedValue({ domains: [] })
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it('normalizes a search and presents the no-registrar result honestly', async () => {
    const searchMock = vi.spyOn(domainsApi, 'search').mockResolvedValue({
      results: [
        {
          name: 'example.com',
          availability: 'unknown',
          verification: 'not_checked',
          source: 'no_registrar',
        },
      ],
    })

    await act(async () => {
      root.render(<DomainPanel projectId="project-1" onClose={() => {}} />)
    })
    const input = container.querySelector<HTMLInputElement>('#domain-search-input')
    expect(input).not.toBeNull()
    if (!input) return

    act(() => inputValue(input, '  Example.COM  '))
    const searchButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Search'
    )
    expect(searchButton).toBeDefined()
    await act(async () => {
      searchButton?.click()
    })

    expect(searchMock).toHaveBeenCalledWith('example.com')
    expect(container.textContent).toContain('Availability: unknown')
    expect(container.textContent).toContain('Verification: not checked')
    expect(container.textContent).toContain('no registrar is configured')
  })

  it('shows pending DNS verification after a connection response', async () => {
    const disconnected = makeDomain({
      hostingConnection: { status: 'disconnected' },
    })
    const pending = makeDomain({
      status: 'pending',
      hostingConnection: { status: 'pending', projectId: 'project-1' },
    })
    listMock.mockResolvedValue({ domains: [disconnected] })
    const connectMock = vi.spyOn(domainsApi, 'connect').mockResolvedValue({ domain: pending })

    await act(async () => {
      root.render(<DomainPanel projectId="project-1" onClose={() => {}} />)
    })
    const connectButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Connect'
    )
    expect(connectButton).toBeDefined()
    await act(async () => {
      connectButton?.click()
    })

    expect(connectMock).toHaveBeenCalledWith('domain-1', 'project-1')
    expect(container.textContent).toContain('Pending DNS verification')
    expect(container.textContent).toContain('not verified or live yet')
  })

  it('surfaces the registrar boundary without claiming registration', async () => {
    listMock.mockResolvedValue({ domains: [makeDomain()] })
    vi.spyOn(domainsApi, 'register').mockRejectedValue(
      new ApiError('Domain registrar is not configured', 501, 'DOMAIN_REGISTRAR_NOT_CONFIGURED')
    )

    await act(async () => {
      root.render(<DomainPanel projectId="project-1" onClose={() => {}} />)
    })
    const registerButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Register'
    )
    expect(registerButton).toBeDefined()
    await act(async () => {
      registerButton?.click()
    })

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'no domain registrar is configured (DOMAIN_REGISTRAR_NOT_CONFIGURED)'
    )
    expect(container.textContent).toContain('No registration was created')
  })
})
