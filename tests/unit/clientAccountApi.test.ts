import { afterEach, describe, expect, it, vi } from 'vitest'
import { accountApi } from '@client/lib/api'

describe('client account API', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the typed account overview with credentialed requests', async () => {
    const data = {
      account: { id: 'account-1', email: 'person@example.com', displayName: 'Person', role: 'user' },
      projects: [],
      totals: { projects: 0, deployments: 0, domains: 0 },
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(accountApi.getOverview()).resolves.toEqual(data)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/account/overview',
      expect.objectContaining({ credentials: 'include' })
    )
  })
})
