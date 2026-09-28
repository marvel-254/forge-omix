import type { AIProvider, ChatRequest, ChatResponse } from './types'

/**
 * Provider router with fallback chain (docs/09 §9.3).
 * Model ids look like `provider/model`; bare ids resolve to the default.
 */
export class ProviderRouter {
  private readonly providers = new Map<string, AIProvider>()
  private readonly fallbackChain: string[]

  constructor(fallbackChain: string[] = ['openrouter', 'ollama']) {
    this.fallbackChain = fallbackChain
  }

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider)
  }

  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id)
  }

  ids(): string[] {
    return [...this.providers.keys()]
  }

  resolveProvider(model: string): AIProvider {
    const [prefix] = model.split('/')
    if (this.providers.has(prefix)) {
      return this.providers.get(prefix)!
    }
    const def = this.providers.get(this.fallbackChain[0])
    if (!def) {
      throw new Error(`No AI provider registered (model: ${model})`)
    }
    return def
  }

  /** Map a model id onto a fallback provider's namespace when needed. */
  mapModel(model: string, providerId: string): string {
    if (model.includes('/')) return model
    return providerId === 'ollama' ? model : `${providerId}/${model}`
  }

  async route(request: ChatRequest): Promise<ChatResponse> {
    const primary = this.resolveProvider(request.model)
    try {
      return await primary.chat(request)
    } catch (primaryError) {
      for (const fallbackId of this.fallbackChain) {
        if (fallbackId === primary.id) continue
        const fallback = this.providers.get(fallbackId)
        if (!fallback) continue
        try {
          return await fallback.chat({
            ...request,
            model: this.mapModel(request.model, fallbackId),
          })
        } catch {
          continue
        }
      }
      throw primaryError
    }
  }
}
