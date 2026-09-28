import type { AIProvider, AiModel, ChatRequest, ChatResponse, StreamChunk } from './types'

/**
 * Deterministic mock provider for tests, offline UI development, and demos.
 * Registered ONLY when `AI_MODE=mock` — never silently. If the latest user
 * message mentions a button, the reply includes a sample add-component op
 * so the panel's apply flow can be exercised end to end.
 */
export class MockAIProvider implements AIProvider {
  readonly id = 'mock'
  readonly name = 'Mock (offline demo)'
  readonly supportsVision = false
  readonly supportsTools = false
  readonly maxContextTokens = 4096

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const lastUser = [...request.messages].reverse().find((m) => m.role === 'user')
    const query = lastUser?.content ?? ''
    let content = `Mock reply to: ${query.slice(0, 200)}`
    if (/button/i.test(query)) {
      content +=
        '\n\nHere is a component you can add:\n```json\n' +
        JSON.stringify(
          {
            action: 'add-component',
            component: {
              id: 'comp_change_me',
              type: 'Button',
              name: 'Mock button',
              props: { label: 'Mock button', variant: 'primary', size: 'md' },
            },
          },
          null,
          2
        ) +
        '\n```'
    }
    const total = Math.ceil(content.length / 4)
    return {
      id: 'mock-1',
      model: request.model || 'mock/default',
      content,
      usage: { promptTokens: 10, completionTokens: total, totalTokens: 10 + total },
      finishReason: 'stop',
    }
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    const full = await this.chat(request)
    const words = full.content.split(/(\s+)/)
    for (const word of words) {
      if (word) yield { content: word, done: false }
    }
    yield { content: '', done: true }
  }

  async listModels(): Promise<AiModel[]> {
    return [{ id: 'mock/default', name: 'Mock default', provider: this.id }]
  }
}
