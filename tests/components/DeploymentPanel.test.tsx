import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DeploymentPanel } from '@client/components/deployments/DeploymentPanel'
import { ApiError, deploymentsApi, type Deployment } from '@client/lib/api'

vi.mock('@client/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@client/lib/api')>()
  return {
    ...actual,
    deploymentsApi: {
      list: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      build: vi.fn(),
      publish: vi.fn(),
      rollback: vi.fn(),
      logs: vi.fn(),
    },
  }
})

const deployment: Deployment = {
  id: 'deployment-1',
  accountId: 'account-1',
  projectId: 'project-1',
  environment: 'preview',
  status: 'queued',
  version: '1.2.3',
  previewUrl: null,
  liveUrl: null,
  commitHash: 'abc123',
  commitMessage: null,
  commitAuthor: null,
  failure: null,
  startedAt: null,
  completedAt: null,
  publishedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const log = {
  id: 'log-1',
  deploymentId: deployment.id,
  accountId: deployment.accountId,
  event: 'deployment.queued',
  message: 'Deployment queued',
  metadata: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

function button(container: HTMLElement, text: string): HTMLButtonElement {
  const match = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.trim() === text)
  if (!match) throw new Error(`Button not found: ${text}`)
  return match
}

describe('DeploymentPanel', () => {
  let container: HTMLDivElement
  let root: Root

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterAll(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = false
  })

  beforeEach(() => {
    vi.clearAllMocks()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('loads an accessible deployment detail with status, progress, failure, and logs', async () => {
    const failed = {
      ...deployment,
      status: 'failed' as const,
      failure: 'Build command exited with code 1',
    }
    vi.mocked(deploymentsApi.list).mockResolvedValue({ deployments: [failed] })
    vi.mocked(deploymentsApi.logs).mockResolvedValue({ logs: [log] })

    act(() => root.render(<DeploymentPanel projectId="project-1" onClose={() => {}} />))
    await flush()

    expect(container.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close deployments')
    expect(container.textContent).toContain('Failed')
    expect(container.textContent).toContain('Lifecycle progress')
    expect(container.querySelector('progress')?.getAttribute('value')).toBe('0')
    expect(container.textContent).toContain('Build command exited with code 1')
    expect(container.textContent).toContain('Deployment queued')
    expect(deploymentsApi.list).toHaveBeenCalledWith('project-1')
  })

  it('creates a queued preview without claiming it is live and starts its build', async () => {
    vi.mocked(deploymentsApi.list).mockResolvedValue({ deployments: [] })
    vi.mocked(deploymentsApi.logs).mockResolvedValue({ logs: [log] })
    const building = {
      ...deployment,
      status: 'building' as const,
      startedAt: '2026-01-01T00:01:00.000Z',
    }
    vi.mocked(deploymentsApi.create).mockResolvedValue({ deployment })
    vi.mocked(deploymentsApi.build).mockResolvedValue({ deployment: building })
    vi.mocked(deploymentsApi.list)
      .mockResolvedValueOnce({ deployments: [] })
      .mockResolvedValue({ deployments: [building] })

    act(() => root.render(<DeploymentPanel projectId="project-1" onClose={() => {}} />))
    await flush()

    await act(async () => button(container, 'Create preview').click())
    await flush()

    expect(deploymentsApi.create).toHaveBeenCalledWith({ projectId: 'project-1', environment: 'preview' })
    expect(container.querySelector('[role="status"]')?.textContent).toContain('queued')
    expect(container.querySelector('[role="status"]')?.textContent).toContain('not live')
    expect(container.textContent).not.toContain('Open live URL')

    await act(async () => button(container, 'Start build').click())
    await flush()

    expect(deploymentsApi.build).toHaveBeenCalledWith('deployment-1')
    expect(container.textContent).toContain('Build started. Server status: Building.')
    expect(container.textContent).toContain('No live URL has been created.')
  })

  it('surfaces the adapter conflict for publish and does not show a live URL', async () => {
    const ready = { ...deployment, status: 'ready' as const }
    vi.mocked(deploymentsApi.list).mockResolvedValue({ deployments: [ready] })
    vi.mocked(deploymentsApi.logs).mockResolvedValue({ logs: [log] })
    vi.mocked(deploymentsApi.publish).mockRejectedValue(
      new ApiError('Deployment adapter is not configured', 501, 'DEPLOY_ADAPTER_NOT_CONFIGURED')
    )

    act(() => root.render(<DeploymentPanel projectId="project-1" onClose={() => {}} />))
    await flush()

    await act(async () => button(container, 'Publish').click())
    await flush()

    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      'Publishing is unavailable: no deployment adapter is configured'
    )
    expect(container.querySelector('[role="status"]')?.textContent).toContain('DEPLOY_ADAPTER_NOT_CONFIGURED')
    expect(container.querySelector('[role="status"]')?.textContent).toContain('No live URL was created')
    expect(container.textContent).not.toContain('Open live URL')
  })

  it('surfaces the adapter conflict for rollback without claiming success', async () => {
    const live = {
      ...deployment,
      status: 'live' as const,
      liveUrl: 'https://example.test',
      publishedAt: '2026-01-01T00:01:00.000Z',
    }
    vi.mocked(deploymentsApi.list).mockResolvedValue({ deployments: [live] })
    vi.mocked(deploymentsApi.logs).mockResolvedValue({ logs: [log] })
    vi.mocked(deploymentsApi.rollback).mockRejectedValue(
      new ApiError('Deployment adapter is not configured', 501, 'DEPLOY_ADAPTER_NOT_CONFIGURED')
    )

    act(() => root.render(<DeploymentPanel projectId="project-1" onClose={() => {}} />))
    await flush()

    await act(async () => button(container, 'Roll back').click())
    await flush()

    expect(deploymentsApi.rollback).toHaveBeenCalledWith('deployment-1')
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      'Rollback is unavailable: no deployment adapter is configured'
    )
    expect(container.querySelector('[role="status"]')?.textContent).toContain('DEPLOY_ADAPTER_NOT_CONFIGURED')
    expect(container.querySelector('[role="status"]')?.textContent).toContain('No live URL was created')
    expect(container.textContent).toContain('Live')
  })
})
