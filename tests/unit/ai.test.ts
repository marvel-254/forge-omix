import { describe, it, expect, vi, afterEach } from 'vitest'
import { OpenRouterProvider, normalizeChatResponse, parseSseStream } from '@server/ai/openrouter'
import { OllamaProvider, normalizeOllamaResponse, parseOllamaStream } from '@server/ai/ollama'
import { ProviderRouter } from '@server/ai/router'
import { BudgetManager, DEFAULT_BUDGET, estimateTokens } from '@server/ai/budget'
import { buildSystemPrompt } from '@server/ai/prompts'
import { filterContext } from '@server/ai/context'
import { extractJsonBlocks, validateAiOperation } from '@server/ai/response'
import { AIProviderError } from '@server/ai/types'

function sseBody(frames: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const frame of frames) controller.enqueue(encoder.encode(frame))
      controller.close()
    },
  })
}

const project = {
  id: 'proj_ai1234',
  name: 'AI App',
  version: '1.0.0',
  pages: [
    {
      id: 'page_home',
      path: '/',
      title: 'Home',
      components: [{ id: 'comp_btn1', type: 'Button', props: { label: 'Go' } }],
    },
  ],
  components: [],
  designTokens: { colors: { primary: '#3B82F6' } },
} as unknown as Parameters<typeof buildSystemPrompt>[0]['project']

describe('normalizeChatResponse', () => {
  it('maps OpenAI-style completions', () => {
    const res = normalizeChatResponse(
      {
        id: 'chatcmpl-1',
        model: 'x/y',
        choices: [{ message: { content: 'hi' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      },
      'fallback'
    )
    expect(res.content).toBe('hi')
    expect(res.usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 })
    expect(res.finishReason).toBe('stop')
  })

  it('tolerates missing fields', () => {
    const res = normalizeChatResponse({}, 'fallback-model')
    expect(res.model).toBe('fallback-model')
    expect(res.content).toBe('')
    expect(res.usage.totalTokens).toBe(0)
  })
})

describe('parseSseStream', () => {
  it('yields content frames until [DONE]', async () => {
    const chunks: string[] = []
    for await (const chunk of parseSseStream(
      sseBody([
        'data: {"choices":[{"delta":{"content":"Hel"}}]}\n',
        'data: {"choices":[{"delta":{"content":"lo"}}]}\n',
        'data: [DONE]\n',
      ])
    )) {
      if (!chunk.done) chunks.push(chunk.content)
    }
    expect(chunks.join('')).toBe('Hello')
  })

  it('skips malformed frames', async () => {
    const chunks: string[] = []
    for await (const chunk of parseSseStream(sseBody(['data: nope{\n', 'data: [DONE]\n']))) {
      if (!chunk.done) chunks.push(chunk.content)
    }
    expect(chunks).toEqual([])
  })
})

describe('OpenRouterProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts chat completions and normalizes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'a',
        model: 'm',
        choices: [{ message: { content: 'yo' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 3, completion_tokens: 1, total_tokens: 4 },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const res = await new OpenRouterProvider('key').chat({ model: 'a/b', messages: [] })
    expect(res.content).toBe('yo')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer key')
  })

  it('wraps HTTP errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'bad key' })
    )
    await expect(
      new OpenRouterProvider('bad').chat({ model: 'a/b', messages: [] })
    ).rejects.toMatchObject({ name: 'AIProviderError', status: 401 } as Partial<AIProviderError>)
  })

  it('wraps network failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('down'))
    )
    await expect(
      new OpenRouterProvider('k').chat({ model: 'a/b', messages: [] })
    ).rejects.toThrow('Network error')
  })
})

describe('OllamaProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps /api/chat responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'llama3',
          message: { content: 'local hi' },
          done: true,
          prompt_eval_count: 4,
          eval_count: 2,
        }),
      })
    )
    const res = await new OllamaProvider().chat({ model: 'llama3', messages: [] })
    expect(res.content).toBe('local hi')
    expect(res.usage).toEqual({ promptTokens: 4, completionTokens: 2, totalTokens: 6 })
  })

  it('normalizes model lists', () => {
    expect(normalizeOllamaResponse({}, 'm').model).toBe('m')
  })

  it('parses newline-delimited streams', async () => {
    const chunks: string[] = []
    for await (const chunk of parseOllamaStream(
      sseBody(['{"message":{"content":"a"},"done":false}\n', '{"message":{},"done":true}\n'])
    )) {
      if (!chunk.done) chunks.push(chunk.content)
    }
    expect(chunks).toEqual(['a'])
  })
})

describe('ProviderRouter', () => {
  it('routes by prefix with fallback', async () => {
    const router = new ProviderRouter(['openrouter', 'ollama'])
    const primary = {
      id: 'openrouter',
      chat: vi.fn().mockResolvedValue({ content: 'cloud' }),
    } as any
    const local = { id: 'ollama', chat: vi.fn().mockResolvedValue({ content: 'local' }) } as any
    router.register(primary)
    router.register(local)
    expect((await router.route({ model: 'openrouter/x', messages: [] })).content).toBe('cloud')
    expect((await router.route({ model: 'llama3', messages: [] })).content).toBe('cloud')
  })

  it('falls back on primary failure', async () => {
    const router = new ProviderRouter(['openrouter', 'ollama'])
    router.register({ id: 'openrouter', chat: vi.fn().mockRejectedValue(new Error('down')) } as any)
    router.register({ id: 'ollama', chat: vi.fn().mockResolvedValue({ content: 'saved' }) } as any)
    const res = await router.route({ model: 'openrouter/x', messages: [] })
    expect(res.content).toBe('saved')
  })

  it('throws when nothing is registered', async () => {
    await expect(new ProviderRouter([]).route({ model: 'x', messages: [] })).rejects.toThrow()
  })
})

describe('BudgetManager', () => {
  it('gates, tracks, and warns', () => {
    const budget = new BudgetManager()
    expect(budget.canProceed('s', 100, DEFAULT_BUDGET)).toBe(true)
    expect(budget.canProceed('s', DEFAULT_BUDGET.maxPerRequest + 1, DEFAULT_BUDGET)).toBe(false)
    budget.track('s', DEFAULT_BUDGET.warningThreshold)
    expect(budget.shouldWarn('s', DEFAULT_BUDGET)).toBe(true)
    expect(budget.canProceed('s', DEFAULT_BUDGET.maxPerSession, DEFAULT_BUDGET)).toBe(false)
    budget.reset('s')
    expect(budget.shouldWarn('s', DEFAULT_BUDGET)).toBe(false)
  })

  it('estimates ~4 chars per token', () => {
    expect(estimateTokens('abcd')).toBe(1)
    expect(estimateTokens('abcde')).toBe(2)
  })
})

describe('buildSystemPrompt', () => {
  it('embeds project context, page, query, and op format', () => {
    const prompt = buildSystemPrompt({ project, currentPageId: 'page_home', userQuery: 'Add a hero' })
    expect(prompt).toContain('AI App')
    expect(prompt).toContain('Current page: / (Home)')
    expect(prompt).toContain('Add a hero')
    expect(prompt).toContain('#3B82F6')
    expect(prompt).toContain('add-component')
  })
})

describe('filterContext', () => {
  it('minimal strips prop values', () => {
    const minimal = filterContext(project, 'minimal') as any
    expect(minimal.pages).toEqual([{ path: '/', componentTypes: ['Button'] }])
    expect(minimal.designTokens.colors.primary).toBe('#3B82F6')
  })

  it('standard drops customCode, full keeps everything', () => {
    const withCode = {
      ...project,
      pages: [{ ...(project.pages as any[])[0], customCode: 'x = 1' }],
    } as any
    expect((filterContext(withCode, 'standard') as any).pages[0].customCode).toBe(undefined)
    expect((filterContext(withCode, 'full') as any).pages[0].customCode).toBe('x = 1')
  })
})

describe('AI operations', () => {
  it('extracts fenced JSON blocks', () => {
    const blocks = extractJsonBlocks('hello\n```json\n{"a":1}\n```\n```\n[1]\n```')
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toEqual({ ok: true, value: { a: 1 } })
    expect(blocks[1]).toEqual({ ok: true, value: [1] })
    expect(extractJsonBlocks('no fences')[0]).toBe(undefined)
    expect(extractJsonBlocks('```json\n{bad}\n```')[0].ok).toBe(false)
  })

  it('validates add-component ops', () => {
    const good = validateAiOperation({
      action: 'add-component',
      component: { id: 'comp_new1', type: 'Button', props: { label: 'Hi' } },
    })
    expect(good.valid).toBe(true)
    expect(good.operation?.action).toBe('add-component')
    expect(validateAiOperation({ action: 'add-component', component: { type: 'Button' } }).valid).toBe(
      false
    )
    expect(
      validateAiOperation({ action: 'dance', component: {} }).valid
    ).toBe(false)
  })

  it('rejects unsafe content', () => {
    const evil = validateAiOperation({
      action: 'add-component',
      component: { id: 'comp_ev11', type: 'Button', props: { label: 'x eval(' } },
    })
    expect(evil.valid).toBe(false)
  })
})
