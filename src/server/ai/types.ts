/**
 * AI provider abstraction (docs/09 §9.1, ADR-007). Custom interface —
 * no vendor SDK assumptions — with OpenRouter and Ollama implementations.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface ChatResponse {
  id: string
  model: string
  content: string
  usage: TokenUsage
  finishReason: 'stop' | 'length' | 'tool_calls'
}

export interface StreamChunk {
  content: string
  done: boolean
}

export interface AiModel {
  id: string
  name: string
  provider: string
}

export interface AIProvider {
  readonly id: string
  readonly name: string
  readonly supportsVision: boolean
  readonly supportsTools: boolean
  readonly maxContextTokens: number
  chat(request: ChatRequest): Promise<ChatResponse>
  stream(request: ChatRequest): AsyncIterable<StreamChunk>
  listModels(): Promise<AiModel[]>
}

export class AIProviderError extends Error {
  readonly providerId: string
  readonly status?: number
  constructor(providerId: string, message: string, status?: number) {
    super(message)
    this.name = 'AIProviderError'
    this.providerId = providerId
    this.status = status
  }
}
