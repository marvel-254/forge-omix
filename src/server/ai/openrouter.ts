import {
  AIProviderError,
  type AIProvider,
  type AiModel,
  type ChatRequest,
  type ChatResponse,
  type StreamChunk,
} from './types'

/**
 * OpenRouter provider (docs/09 §9.2): 200+ models behind an OpenAI-style
 * `/chat/completions` endpoint. Default cloud provider.
 */
export class OpenRouterProvider implements AIProvider {
  readonly id = 'openrouter'
  readonly name = 'OpenRouter'
  readonly supportsVision = true
  readonly supportsTools = true
  readonly maxContextTokens = 128000

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = 'https://openrouter.ai/api/v1'
  ) {}

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://forge-omix.dev',
      'X-Title': 'Omix Builder',
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
          stream: false,
        }),
      })
    } catch (error) {
      throw new AIProviderError(this.id, `Network error: ${(error as Error).message}`)
    }
    if (!res.ok) {
      throw new AIProviderError(this.id, `HTTP ${res.status}: ${await safeBody(res)}`, res.status)
    }
    return normalizeChatResponse(await res.json(), request.model)
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
          stream: true,
        }),
      })
    } catch (error) {
      throw new AIProviderError(this.id, `Network error: ${(error as Error).message}`)
    }
    if (!res.ok || !res.body) {
      throw new AIProviderError(this.id, `HTTP ${res.status}: ${await safeBody(res)}`, res.status)
    }
    yield* parseSseStream(res.body)
  }

  async listModels(): Promise<AiModel[]> {
    // OpenRouter serves hundreds of models; the builder curates a short
    // default list instead of paginating the catalog here.
    return [
      { id: 'openrouter/auto', name: 'Auto (recommended)', provider: this.id },
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: this.id },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o mini', provider: this.id },
    ]
  }
}

async function safeBody(res: Response): Promise<string> {
  try {
    return await res.text()
  } catch {
    return 'unreadable response body'
  }
}

/** Normalize an OpenAI-style chat completion into ChatResponse. Exported for tests. */
export function normalizeChatResponse(data: any, fallbackModel: string): ChatResponse {
  const choice = data?.choices?.[0] ?? {}
  const usage = data?.usage ?? {}
  return {
    id: String(data?.id ?? ''),
    model: String(data?.model ?? fallbackModel),
    content: String(choice?.message?.content ?? ''),
    usage: {
      promptTokens: Number(usage?.prompt_tokens ?? 0),
      completionTokens: Number(usage?.completion_tokens ?? 0),
      totalTokens: Number(
        usage?.total_tokens ?? Number(usage?.prompt_tokens ?? 0) + Number(usage?.completion_tokens ?? 0)
      ),
    },
    finishReason:
      choice?.finish_reason === 'length'
        ? 'length'
        : choice?.finish_reason === 'tool_calls'
          ? 'tool_calls'
          : 'stop',
  }
}

/** Parse OpenAI-style SSE (`data: {...}` frames, `[DONE]` terminator). Exported for tests. */
export async function* parseSseStream(body: ReadableStream<Uint8Array>): AsyncIterable<StreamChunk> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const frames = buffer.split('\n')
      buffer = frames.pop() ?? ''
      for (const frame of frames) {
        const line = frame.trim()
        if (!line.startsWith('data:')) continue
        const data = line.slice('data:'.length).trim()
        if (data === '[DONE]') {
          yield { content: '', done: true }
          return
        }
        try {
          const parsed = JSON.parse(data)
          const content = String(parsed?.choices?.[0]?.delta?.content ?? '')
          if (content) yield { content, done: false }
        } catch {
          // Skip malformed frames.
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
  yield { content: '', done: true }
}
