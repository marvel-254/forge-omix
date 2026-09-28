import { afterEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '@client/lib/api'

describe('client auth API', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends credentialed register requests and exposes the session result', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { token: 'token', user: { id: 'account', email: 'a@example.com', displayName: null, role: 'user' } } }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(authApi.register({ email: 'a@example.com', password: 'correct horse battery staple' })).resolves.toMatchObject({
      token: 'token',
      user: { id: 'account' },
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/register',
      expect.objectContaining({ credentials: 'include', method: 'POST' })
    )
  })
})
