import {
  AIProviderError,
  type AIProvider,
  type AiModel,
  type ChatRequest,
  type ChatResponse,
  type StreamChunk,
} from './types'
import { normalizeChatResponse, parseSseStream } from './openrouter'

/**
 * Generic OpenAI-compatible provider. Powers OpenAI, Groq, DeepSeek, Mistral,
 * xAI and any custom `/chat/completions` endpoint (LM Studio, vLLM, …) by
 * pointing OPENAI_COMPAT_BASE_URL at it. No vendor SDK — plain fetch, matching
 * the existing openrouter/ollama implementations (ADR-007).
 */
export class OpenAICompatProvider implements AIProvider {
  readonly id: string
  readonly name: string
  readonly supportsVision = true
  readonly supportsTools = true
  readonly maxContextTokens: number

  constructor(
    id: string,
    name: string,
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly models: AiModel[],
    maxContextTokens = 128000
  ) {
    this.id = id
    this.name = name
    this.maxContextTokens = maxContextTokens
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
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
    // Prefer the provider's live catalog; fall back to the static list on error.
    try {
      const res = await fetch(`${this.baseUrl}/models`, { headers: this.headers() })
      if (res.ok) {
        const data = (await res.json()) as { data?: Array<{ id?: string }> }
        const models = Array.isArray(data?.data) ? data.data : []
        if (models.length > 0) {
          return models
            .map((m) => String(m?.id ?? ''))
            .filter((id) => id.length > 0)
            .slice(0, 100)
            .map((id) => ({ id, name: id, provider: this.id }))
        }
      }
    } catch {
      // Fall through to the static list.
    }
    return this.models
  }
}

async function safeBody(res: Response): Promise<string> {
  try {
    return await res.text()
  } catch {
    return 'unreadable response body'
  }
}
