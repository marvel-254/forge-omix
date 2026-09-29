import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { createApiResponse, createErrorResponse } from '../utils'
import { createValidationMiddleware } from '../middleware/validation'
import { OpenRouterProvider } from '../ai/openrouter'
import { OllamaProvider } from '../ai/ollama'
import { OpenAICompatProvider } from '../ai/openai-compat'
import { AnthropicProvider } from '../ai/anthropic'
import { MockAIProvider } from '../ai/mock'
import { ProviderRouter } from '../ai/router'
import { BudgetManager, DEFAULT_BUDGET, estimateMessagesTokens } from '../ai/budget'
import { AIProviderError, type AIProvider } from '../ai/types'
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware'
import aiCreationRouter from './aiCreation'

/**
 * AI routes (Phase 9, docs/09 §9.6). Provider wiring is env-driven and
 * multi-provider: every provider with credentials in the environment is
 * registered, with AI_MODE as an override — `mock` → deterministic offline
 * provider, `local` → Ollama only, `cloud` → cloud keys only, `auto`
 * (default) → cloud keys + Ollama. The fallback chain follows
 * AI_PROVIDER_ORDER when set (comma-separated provider ids), otherwise
 * registration order: openrouter, openai, anthropic, groq, deepseek,
 * mistral, custom OpenAI-compatible, ollama. No providers configured →
 * 503 AI_NOT_CONFIGURED.
 */

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(20000),
})

const chatSchema = z
  .object({
    model: z.string().min(1).max(200),
    messages: z.array(messageSchema).min(1).max(50),
    sessionId: z.string().min(1).max(100).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(8000).optional(),
  })
  .passthrough()

const router = new Hono<AuthEnv>()
router.use('*', authMiddleware())

let cachedRouter: ProviderRouter | null = null
const budgets = new BudgetManager()

/** Model presets for providers without a cheap live catalog. */
const MODEL_PRESETS = {
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'groq' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'deepseek' },
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral' },
    { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'mistral' },
  ],
} as const

/**
 * Build (and cache) the router from the environment. Test seam: resetAiRouter().
 * Registration (and thus default fallback) order: openrouter, openai,
 * anthropic, groq, deepseek, mistral, custom OpenAI-compatible, ollama.
 */
export function getAiRouter(): ProviderRouter | null {
  if (cachedRouter) return cachedRouter
  const mode = process.env.AI_MODE ?? 'auto'

  if (mode === 'mock') {
    const mockOnly = new ProviderRouter(['mock'])
    mockOnly.register(new MockAIProvider())
    cachedRouter = mockOnly
    return cachedRouter
  }

  const out = new ProviderRouter()
  const registered: string[] = []
  const add = (id: string, make: () => AIProvider): void => {
    // Guard the shared 'openai' slot (native OpenAI vs custom-compatible).
    if (out.getProvider(id)) return
    out.register(make())
    registered.push(id)
  }

  if (mode === 'auto' || mode === 'cloud') {
    const orKey = process.env.OPENROUTER_API_KEY
    if (orKey) add('openrouter', () => new OpenRouterProvider(orKey, process.env.OPENROUTER_BASE_URL))

    const oaKey = process.env.OPENAI_API_KEY
    if (oaKey) {
      add(
        'openai',
        () =>
          new OpenAICompatProvider(
            'openai',
            'OpenAI',
            oaKey,
            process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
            [
              { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'openai' },
              { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
            ]
          )
      )
    }

    // Custom OpenAI-compatible endpoint (LM Studio, vLLM, OpenWebUI, …) —
    // uses the 'openai' slot when native OpenAI is not configured.
    if (!oaKey && process.env.OPENAI_COMPAT_BASE_URL) {
      add(
        'openai',
        () =>
          new OpenAICompatProvider(
            'openai',
            'OpenAI-compatible',
            process.env.OPENAI_COMPAT_API_KEY ?? '',
            process.env.OPENAI_COMPAT_BASE_URL!,
            [{ id: 'local-custom', name: 'Local model', provider: 'openai' }],
            32000
          )
      )
    }

    const anKey = process.env.ANTHROPIC_API_KEY
    if (anKey) add('anthropic', () => new AnthropicProvider(anKey, process.env.ANTHROPIC_BASE_URL))

    const groqKey = process.env.GROQ_API_KEY
    if (groqKey) {
      add(
        'groq',
        () =>
          new OpenAICompatProvider(
            'groq',
            'Groq',
            groqKey,
            process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1',
            [...MODEL_PRESETS.groq],
            128000
          )
      )
    }

    const dsKey = process.env.DEEPSEEK_API_KEY
    if (dsKey) {
      add(
        'deepseek',
        () =>
          new OpenAICompatProvider(
            'deepseek',
            'DeepSeek',
            dsKey,
            process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1',
            [...MODEL_PRESETS.deepseek],
            128000
          )
      )
    }

    const mistralKey = process.env.MISTRAL_API_KEY
    if (mistralKey) {
      add(
        'mistral',
        () =>
          new OpenAICompatProvider(
            'mistral',
            'Mistral',
            mistralKey,
            process.env.MISTRAL_BASE_URL ?? 'https://api.mistral.ai/v1',
            [...MODEL_PRESETS.mistral],
            128000
          )
      )
    }
  }

  // Local Ollama is the zero-config fallback unless explicitly disabled.
  if ((mode === 'auto' || mode === 'local') && process.env.OLLAMA_ENABLED !== 'false') {
    add('ollama', () => new OllamaProvider(process.env.OLLAMA_BASE_URL))
  }

  // AI_PROVIDER_ORDER reorders the fallback chain; unlisted providers keep
  // registration order after the listed ones. Unknown ids are ignored.
  const order = (process.env.AI_PROVIDER_ORDER ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((id) => registered.includes(id))
  const rest = registered.filter((id) => !order.includes(id))
  const chain = [...order, ...rest]
  if (chain.length > 0) out.setFallbackChain(chain)

  cachedRouter = chain.length > 0 ? out : null
  return cachedRouter
}

export function resetAiRouter(): void {
  cachedRouter = null
}

type ChatBody = {
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  sessionId?: string
  temperature?: number
  maxTokens?: number
}

function checkBudget(
  c: Parameters<typeof createErrorResponse>[0],
  sessionId: string,
  estimated: number
): Response | null {
  if (!budgets.canProceed(sessionId, estimated, DEFAULT_BUDGET)) {
    return createErrorResponse(c, 'BUDGET_EXCEEDED', 'Token budget exceeded for this session', 429)
  }
  return null
}

const NOT_CONFIGURED_MSG =
  'No AI provider configured (set a provider API key — OPENROUTER/OPENAI/ANTHROPIC/GROQ/DEEPSEEK/MISTRAL — or point OPENAI_COMPAT_BASE_URL at an OpenAI-compatible endpoint, or AI_MODE=mock)'

// Non-streaming chat.
router.post('/chat', createValidationMiddleware(chatSchema), async (c) => {
  try {
    const body = c.get('validatedData') as ChatBody
    const provider = getAiRouter()
    if (!provider) {
      return createErrorResponse(c, 'AI_NOT_CONFIGURED', NOT_CONFIGURED_MSG, 503)
    }
    const sessionId = body.sessionId ?? 'default'
    const estimated = estimateMessagesTokens(body.messages) + (body.maxTokens ?? 2048)
    const blocked = checkBudget(c, sessionId, estimated)
    if (blocked) return blocked
    const response = await provider.route({
      model: body.model,
      messages: body.messages,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    })
    budgets.track(sessionId, response.usage.totalTokens)
    return createApiResponse(c, {
      ...response,
      budget: { used: budgets.used(sessionId), warn: budgets.shouldWarn(sessionId, DEFAULT_BUDGET) },
    })
  } catch (error) {
    if (error instanceof AIProviderError) {
      return createErrorResponse(c, 'AI_PROVIDER_ERROR', error.message, undefined, 502)
    }
    return createErrorResponse(c, 'INTERNAL_SERVER_ERROR', 'AI request failed', undefined, 500)
  }
})

// Streaming chat (Server-Sent Events).
router.post('/stream', createValidationMiddleware(chatSchema), async (c) => {
  const body = c.get('validatedData') as ChatBody
  const provider = getAiRouter()
  if (!provider) {
    return createErrorResponse(c, 'AI_NOT_CONFIGURED', NOT_CONFIGURED_MSG, 503)
  }
  const sessionId = body.sessionId ?? 'default'
  const estimated = estimateMessagesTokens(body.messages) + (body.maxTokens ?? 2048)
  const blocked = checkBudget(c, sessionId, estimated)
  if (blocked) return blocked
  const resolved = provider.resolveProvider(body.model)
  let tracked = 0
  return streamSSE(c, async (sse) => {
    try {
      for await (const chunk of resolved.stream({
        model: body.model,
        messages: body.messages,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
      })) {
        tracked += chunk.content.length
        await sse.writeSSE({ data: JSON.stringify(chunk) })
      }
    } catch (error) {
      await sse.writeSSE({
        data: JSON.stringify({
          content: '',
          done: true,
          error: error instanceof Error ? error.message : 'Stream failed',
        }),
      })
    } finally {
      budgets.track(sessionId, Math.ceil(tracked / 4))
    }
  })
})

// Model catalog across registered providers.
router.get('/models', async (c) => {
  try {
    const provider = getAiRouter()
    if (!provider) {
      return createErrorResponse(c, 'AI_NOT_CONFIGURED', NOT_CONFIGURED_MSG, 503)
    }
    const lists = await Promise.all(
      provider.ids().map(async (id) => {
        try {
          return (await provider.getProvider(id)?.listModels()) ?? []
        } catch {
          return []
        }
      })
    )
    return createApiResponse(c, lists.flat())
  } catch (error) {
    return createErrorResponse(c, 'INTERNAL_SERVER_ERROR', 'Failed to list models', undefined, 500)
  }
})

router.route('/creation', aiCreationRouter)

export default router
