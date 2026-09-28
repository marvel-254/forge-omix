import { afterEach, describe, expect, it, vi } from 'vitest'
import { aiApi, type AiCreationSession } from '@client/lib/api'

const session: AiCreationSession = {
  id: 'ai_session_1',
  status: 'draft',
  step: 'brief',
  brief: 'A booking site',
  projectName: '',
  clarifications: { audience: 'therapists' },
  assets: {},
  generatedProject: null,
  error: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('AI creation client API', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates, gets, updates, and generates creation sessions', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => response({ session }))
    vi.stubGlobal('fetch', fetchMock)

    await aiApi.createCreationSession({
      brief: session.brief,
      projectName: session.projectName,
      clarifications: session.clarifications,
      assets: session.assets,
    })
    await aiApi.getCreationSession(session.id)
    await aiApi.updateCreationSession(session.id, { step: 'review' })
    await aiApi.generateCreationSession(session.id)

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET'])).toEqual([
      ['http://localhost:3001/api/ai/creation/sessions', 'POST'],
      ['http://localhost:3001/api/ai/creation/sessions/ai_session_1', 'GET'],
      ['http://localhost:3001/api/ai/creation/sessions/ai_session_1', 'PATCH'],
      ['http://localhost:3001/api/ai/creation/sessions/ai_session_1/generate', 'POST'],
    ])
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toEqual({ step: 'review' })
  })

  it('rejects a failed envelope with the server error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, error: { message: 'Not found', code: 'NOT_FOUND' } }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        })
      )
    )

    await expect(aiApi.getCreationSession('missing')).rejects.toMatchObject({
      message: 'Not found',
      status: 404,
      code: 'NOT_FOUND',
    })
  })
})
