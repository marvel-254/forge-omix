import {
  AIProviderError,
  type AIProvider,
  type AiModel,
  type ChatRequest,
  type ChatResponse,
  type StreamChunk,
} from './types'

/**
 * Anthropic provider (docs/09 §9.2 pattern): Claude models via the Messages
 * API. The Messages API has no system role and emits its own SSE shape, so
 * this is a first-class provider rather than an OpenAI-compatible one.
 * Auth uses the standard `x-api-key` + `anthropic-version` headers.
 */
export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic'
  readonly name = 'Anthropic'
  readonly supportsVision = true
  readonly supportsTools = true
  readonly maxContextTokens = 200000

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = 'https://api.anthropic.com',
    private readonly version = '2023-06-01'
  ) {}

  private headers(): Record<string, string> {
    return {
      'x-api-key': this.apiKey,
      'anthropic-version': this.version,
      'Content-Type': 'application/json',
    }
  }

  /** Split an OpenAI-style message list into Anthropic system + turns. */
  private toAnthropicMessages(messages: ChatRequest['messages']): {
    system: string | undefined
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  } {
    const systemParts: string[] = []
    const turns: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const m of messages) {
      if (m.role === 'system') {
        systemParts.push(m.content)
      } else {
        turns.push({ role: m.role, content: m.content })
      }
    }
    return { system: systemParts.length > 0 ? systemParts.join('\n\n') : undefined, messages: turns }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { system, messages } = this.toAnthropicMessages(request.messages)
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.maxTokens ?? 4096,
          system,
          messages,
          temperature: request.temperature ?? 0.7,
          stream: false,
        }),
      })
    } catch (error) {
      throw new AIProviderError(this.id, `Network error: ${(error as Error).message}`)
    }
    if (!res.ok) {
      throw new AIProviderError(this.id, `HTTP ${res.status}: ${await safeBody(res)}`, res.status)
    }
    return normalizeAnthropicResponse(await res.json(), request.model)
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    const { system, messages } = this.toAnthropicMessages(request.messages)
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.maxTokens ?? 4096,
          system,
          messages,
          temperature: request.temperature ?? 0.7,
          stream: true,
        }),
      })
    } catch (error) {
      throw new AIProviderError(this.id, `Network error: ${(error as Error).message}`)
    }
    if (!res.ok || !res.body) {
      throw new AIProviderError(this.id, `HTTP ${res.status}: ${await safeBody(res)}`, res.status)
    }
    yield* parseAnthropicStream(res.body)
  }

  async listModels(): Promise<AiModel[]> {
    return [
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: this.id },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: this.id },
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

/** Normalize a Messages API response into ChatResponse. Exported for tests. */
export function normalizeAnthropicResponse(data: any, fallbackModel: string): ChatResponse {
  const usage = data?.usage ?? {}
  const promptTokens = Number(usage?.input_tokens ?? 0)
  const completionTokens = Number(usage?.output_tokens ?? 0)
  return {
    id: String(data?.id ?? ''),
    model: String(data?.model ?? fallbackModel),
    content: String(data?.content?.[0]?.text ?? ''),
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
    finishReason:
      data?.stop_reason === 'max_tokens' ? 'length' : data?.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
  }
}

/** Parse Anthropic SSE (`event:`/`data:` frames, content_block_delta payloads). Exported for tests. */
export async function* parseAnthropicStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<StreamChunk> {
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
        if (!data || data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          if (parsed?.type === 'content_block_delta') {
            const content = String(parsed?.delta?.text ?? '')
            if (content) yield { content, done: false }
          } else if (parsed?.type === 'message_stop') {
            yield { content: '', done: true }
            return
          }
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
