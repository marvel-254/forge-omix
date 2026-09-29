import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnthropicProvider, normalizeAnthropicResponse, parseAnthropicStream } from '@server/ai/anthropic'
import { OpenAICompatProvider } from '@server/ai/openai-compat'
import { normalizeChatResponse, parseSseStream } from '@server/ai/openrouter'
import { ProviderRouter } from '@server/ai/router'

const chatRequest = {
  model: 'test-model',
  messages: [{ role: 'user' as const, content: 'hi' }],
}

function sseResponse(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(new TextEncoder().encode(c))
      controller.close()
    },
  })
  return new Response(body, { status: 200 })
}

describe('OpenAICompatProvider', () => {
  it('posts to /chat/completions with bearer auth and normalizes the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'c1',
          model: 'test-model',
          choices: [{ message: { content: 'hello' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 3, completion_tokens: 5, total_tokens: 8 },
        }),
        { status: 200 }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new OpenAICompatProvider(
      'openai',
      'OpenAI',
      'sk-test',
      'https://api.example.com/v1',
      [{ id: 'test-model', name: 'Test', provider: 'openai' }]
    )
    const res = await provider.chat(chatRequest)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.example.com/v1/chat/completions')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test')
    expect(res.content).toBe('hello')
    expect(res.usage.totalTokens).toBe(8)
    vi.unstubAllGlobals()
  })

  it('listModels falls back to static presets when /models fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('offline'))
    )
    const fallback = [{ id: 'preset', name: 'Preset', provider: 'openai' }]
    const provider = new OpenAICompatProvider('openai', 'OpenAI', 'k', 'https://x/v1', fallback)
    expect(await provider.listModels()).toEqual(fallback)
    vi.unstubAllGlobals()
  })

  it('listModels uses the live catalog when available', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [{ id: 'a' }, { id: 'b' }] }), { status: 200 })
      )
    )
    const provider = new OpenAICompatProvider('openai', 'OpenAI', 'k', 'https://x/v1', [])
    const models = await provider.listModels()
    expect(models.map((m) => m.id)).toEqual(['a', 'b'])
    vi.unstubAllGlobals()
  })
})

describe('AnthropicProvider', () => {
  it('hoists system messages and uses x-api-key auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'm1',
          model: 'claude-x',
          content: [{ type: 'text', text: 'hi there' }],
          usage: { input_tokens: 4, output_tokens: 6 },
          stop_reason: 'end_turn',
        }),
        { status: 200 }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new AnthropicProvider('ak-test')
    const res = await provider.chat({
      model: 'claude-x',
      messages: [
        { role: 'system', content: 'be nice' },
        { role: 'user', content: 'hello' },
      ],
    })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('ak-test')
    const body = JSON.parse(String(init.body))
    expect(body.system).toBe('be nice')
    expect(body.messages).toEqual([{ role: 'user', content: 'hello' }])
    expect(res.content).toBe('hi there')
    expect(res.usage.totalTokens).toBe(10)
    vi.unstubAllGlobals()
  })

  it('maps stop reasons correctly', () => {
    expect(normalizeAnthropicResponse({ stop_reason: 'max_tokens' }, 'm').finishReason).toBe('length')
    expect(normalizeAnthropicResponse({ stop_reason: 'tool_use' }, 'm').finishReason).toBe('tool_calls')
    expect(normalizeAnthropicResponse({ stop_reason: 'end_turn' }, 'm').finishReason).toBe('stop')
  })

  it('parses anthropic SSE deltas and stops on message_stop', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder()
        controller.enqueue(
          enc.encode('event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"text":"Hel"}}\n\n')
        )
        controller.enqueue(
          enc.encode('data: {"type":"content_block_delta","delta":{"text":"lo"}}\n\nevent: ping\ndata: {}\n\n')
        )
        controller.enqueue(enc.encode('data: {"type":"message_stop"}\n\n'))
        controller.close()
      },
    })
    const out: string[] = []
    for await (const chunk of parseAnthropicStream(body)) {
      if (chunk.content) out.push(chunk.content)
      if (chunk.done) break
    }
    expect(out.join('')).toBe('Hello')
  })
})

describe('SSE helpers', () => {
  it('parseSseStream handles [DONE] termination', async () => {
    const res = sseResponse([
      'data: {"choices":[{"delta":{"content":"a"}}]}\n\n',
      'data: [DONE]\n\n',
      'data: {"choices":[{"delta":{"content":"never"}}]}\n\n',
    ])
    const out: string[] = []
    for await (const chunk of parseSseStream(res.body!)) {
      if (chunk.content) out.push(chunk.content)
      if (chunk.done) break
    }
    expect(out.join('')).toBe('a')
  })

  it('normalizeChatResponse computes total tokens from parts', () => {
    const r = normalizeChatResponse(
      { id: 'x', model: 'm', choices: [{ message: { content: 'c' }, finish_reason: 'length' }], usage: { prompt_tokens: 2, completion_tokens: 3 } },
      'm'
    )
    expect(r.usage.totalTokens).toBe(5)
    expect(r.finishReason).toBe('length')
  })
})

describe('ProviderRouter ordering', () => {
  const makeProvider = (id: string) => ({
    id,
    name: id,
    supportsVision: false,
    supportsTools: false,
    maxContextTokens: 1024,
    chat: vi.fn().mockResolvedValue({
      id: '1',
      model: 'm',
      content: `from-${id}`,
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      finishReason: 'stop' as const,
    }),
    stream: vi.fn(),
    listModels: vi.fn().mockResolvedValue([]),
  })

  it('setFallbackChain reorders fallbacks and ignores unknown ids', async () => {
    const router = new ProviderRouter(['a', 'b'])
    router.register(makeProvider('a'))
    router.register(makeProvider('b'))
    router.setFallbackChain(['nope', 'b', 'a'])
    // a is now second in the chain, so 'a'-prefixed model fails over to b... wait,
    // chain is ['b', 'a'].
    const res = await router.route({ model: 'unknown/model', messages: [{ role: 'user', content: 'hi' }] })
    expect(res.content).toBe('from-b')
  })

  it('setFallbackChain is a no-op for an empty list', async () => {
    const router = new ProviderRouter(['a'])
    router.register(makeProvider('a'))
    router.setFallbackChain([])
    const res = await router.route({ model: 'x', messages: [{ role: 'user', content: 'hi' }] })
    expect(res.content).toBe('from-a')
  })
})
