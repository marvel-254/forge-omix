import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, domainsApi, type Domain } from '@client/lib/api'

const domain: Domain = {
  id: 'domain/1',
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
}

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('domain client API', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps domain search, lifecycle endpoints, and encoded identifiers', async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
      response({ domains: [domain], domain, results: [] })
    )
    vi.stubGlobal('fetch', fetchMock)

    await domainsApi.search('Example.com')
    await domainsApi.list()
    await domainsApi.create({ name: 'example.com', projectId: 'project/1' })
    await domainsApi.connect('domain/1', 'project/1')
    await domainsApi.disconnect('domain/1')
    await domainsApi.register('domain/1')

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET'])).toEqual([
      ['http://localhost:3001/api/domains/search?q=Example.com', 'GET'],
      ['http://localhost:3001/api/domains', 'GET'],
      ['http://localhost:3001/api/domains', 'POST'],
      ['http://localhost:3001/api/domains/domain%2F1/connect', 'POST'],
      ['http://localhost:3001/api/domains/domain%2F1/disconnect', 'POST'],
      ['http://localhost:3001/api/domains/domain%2F1/register', 'POST'],
    ])
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toEqual({
      name: 'example.com',
      projectId: 'project/1',
    })
    expect(JSON.parse(String(fetchMock.mock.calls[3][1]?.body))).toEqual({ projectId: 'project/1' })
  })

  it('preserves the no-registrar registration error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'DOMAIN_REGISTRAR_NOT_CONFIGURED', message: 'Domain registrar is not configured' },
          }),
          { status: 501, headers: { 'content-type': 'application/json' } }
        )
      )
    )

    await expect(domainsApi.register('domain-1')).rejects.toEqual(
      expect.objectContaining<ApiError>({
        code: 'DOMAIN_REGISTRAR_NOT_CONFIGURED',
        status: 501,
        message: 'Domain registrar is not configured',
      })
    )
  })
})
