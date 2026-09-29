import {
  AIProviderError,
  type AIProvider,
  type AiModel,
  type ChatRequest,
  type ChatResponse,
  type StreamChunk,
} from './types'

/**
 * Ollama provider (docs/09 §9.2): local inference for privacy/offline use.
 * No API key required.
 */
export class OllamaProvider implements AIProvider {
  readonly id = 'ollama'
  readonly name = 'Ollama (Local)'
  readonly supportsVision = true
  readonly supportsTools = true
  readonly maxContextTokens = 8192

  constructor(private readonly baseUrl = 'http://localhost:11434') {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          stream: false,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.maxTokens,
          },
        }),
      })
    } catch (error) {
      throw new AIProviderError(this.id, `Network error: ${(error as Error).message}`)
    }
    if (!res.ok) {
      throw new AIProviderError(this.id, `HTTP ${res.status}`, res.status)
    }
    return normalizeOllamaResponse(await res.json(), request.model)
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
          options: { temperature: request.temperature ?? 0.7, num_predict: request.maxTokens },
        }),
      })
    } catch (error) {
      throw new AIProviderError(this.id, `Network error: ${(error as Error).message}`)
    }
    if (!res.ok || !res.body) {
      throw new AIProviderError(this.id, `HTTP ${res.status}`, res.status)
    }
    yield* parseOllamaStream(res.body)
  }

  async listModels(): Promise<AiModel[]> {
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}/api/tags`)
    } catch (error) {
      throw new AIProviderError(this.id, `Network error: ${(error as Error).message}`)
    }
    if (!res.ok) {
      throw new AIProviderError(this.id, `HTTP ${res.status}`, res.status)
    }
    const data = (await res.json()) as { models?: unknown }
    const models = Array.isArray(data?.models) ? (data.models as Array<{ name?: string }>) : []
    return models.map((m) => ({
      id: String(m?.name ?? 'unknown'),
      name: String(m?.name ?? 'unknown'),
      provider: this.id,
    }))
  }
}

/** Normalize an Ollama `/api/chat` (non-streaming) response. Exported for tests. */
export function normalizeOllamaResponse(data: any, fallbackModel: string): ChatResponse {
  return {
    id: '',
    model: String(data?.model ?? fallbackModel),
    content: String(data?.message?.content ?? ''),
    usage: {
      promptTokens: Number(data?.prompt_eval_count ?? 0),
      completionTokens: Number(data?.eval_count ?? 0),
      totalTokens: Number(data?.prompt_eval_count ?? 0) + Number(data?.eval_count ?? 0),
    },
    finishReason: data?.done === false ? 'length' : 'stop',
  }
}

/** Parse Ollama newline-delimited JSON stream. Exported for tests. */
export async function* parseOllamaStream(body: ReadableStream<Uint8Array>): AsyncIterable<StreamChunk> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        try {
          const parsed = JSON.parse(trimmed)
          const content = String(parsed?.message?.content ?? '')
          if (content) yield { content, done: false }
          if (parsed?.done === true) {
            yield { content: '', done: true }
            return
          }
        } catch {
          // Skip malformed lines.
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
  yield { content: '', done: true }
}
