import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, deploymentsApi, type Deployment } from '@client/lib/api'

const deployment: Deployment = {
  id: 'deployment/1',
  accountId: 'account-1',
  projectId: 'project-1',
  environment: 'preview',
  status: 'queued',
  version: '1.2.3',
  previewUrl: null,
  liveUrl: null,
  commitHash: null,
  failure: null,
  startedAt: null,
  completedAt: null,
  publishedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('deployment client API', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps every deployment endpoint and encodes identifiers', async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
      response({ deployment, deployments: [deployment], logs: [] })
    )
    vi.stubGlobal('fetch', fetchMock)

    await deploymentsApi.create({ projectId: 'project-1', environment: 'preview', version: '1.2.3' })
    await deploymentsApi.list('project-1')
    await deploymentsApi.get('deployment/1')
    await deploymentsApi.build('deployment/1')
    await deploymentsApi.publish('deployment/1')
    await deploymentsApi.rollback('deployment/1')
    await deploymentsApi.logs('deployment/1')

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET'])).toEqual([
      ['http://localhost:3001/api/deployments', 'POST'],
      ['http://localhost:3001/api/deployments?projectId=project-1', 'GET'],
      ['http://localhost:3001/api/deployments/deployment%2F1', 'GET'],
      ['http://localhost:3001/api/deployments/deployment%2F1/build', 'POST'],
      ['http://localhost:3001/api/deployments/deployment%2F1/publish', 'POST'],
      ['http://localhost:3001/api/deployments/deployment%2F1/rollback', 'POST'],
      ['http://localhost:3001/api/deployments/deployment%2F1/logs', 'GET'],
    ])
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      projectId: 'project-1',
      environment: 'preview',
      version: '1.2.3',
    })
  })

  it('preserves the not-configured deployment adapter error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'DEPLOY_ADAPTER_NOT_CONFIGURED', message: 'Deployment adapter is not configured' },
          }),
          { status: 501, headers: { 'content-type': 'application/json' } }
        )
      )
    )

    await expect(deploymentsApi.publish('deployment-1')).rejects.toEqual(
      expect.objectContaining<ApiError>({
        code: 'DEPLOY_ADAPTER_NOT_CONFIGURED',
        status: 501,
        message: 'Deployment adapter is not configured',
      })
    )
  })
})
