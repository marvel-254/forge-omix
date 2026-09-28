import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { createApiResponse, createErrorResponse } from '../utils'
import { createValidationMiddleware } from '../middleware/validation'
import { OpenRouterProvider } from '../ai/openrouter'
import { OllamaProvider } from '../ai/ollama'
import { MockAIProvider } from '../ai/mock'
import { ProviderRouter } from '../ai/router'
import { BudgetManager, DEFAULT_BUDGET, estimateMessagesTokens } from '../ai/budget'
import { AIProviderError } from '../ai/types'
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware'
import aiCreationRouter from './aiCreation'

/**
 * AI routes (Phase 9, docs/09 §9.6). Provider wiring follows AI_MODE:
 * `local` → Ollama only, `mock` → deterministic offline provider,
 * otherwise OpenRouter (when OPENROUTER_API_KEY is set) with Ollama
 * fallback. No keys configured → 503 AI_NOT_CONFIGURED.
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

/** Build (and cache) the router from the environment. Test seam: resetAiRouter(). */
export function getAiRouter(): ProviderRouter | null {
  if (cachedRouter) return cachedRouter
  const mode = process.env.AI_MODE ?? 'cloud'
  const router = new ProviderRouter()
  if (mode === 'mock') {
    router.register(new MockAIProvider())
  } else if (mode === 'local') {
    router.register(new OllamaProvider(process.env.OLLAMA_BASE_URL))
  } else {
    const key = process.env.OPENROUTER_API_KEY
    if (key) router.register(new OpenRouterProvider(key, process.env.OPENROUTER_BASE_URL))
    router.register(new OllamaProvider(process.env.OLLAMA_BASE_URL))
  }
  cachedRouter = router.ids().length > 0 ? router : null
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

// Non-streaming chat.
router.post('/chat', createValidationMiddleware(chatSchema), async (c) => {
  try {
    const body = c.get('validatedData') as ChatBody
    const provider = getAiRouter()
    if (!provider) {
      return createErrorResponse(
        c,
        'AI_NOT_CONFIGURED',
        'No AI provider configured (set OPENROUTER_API_KEY or AI_MODE=local|mock)',
        503
      )
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
    return createErrorResponse(
      c,
      'AI_NOT_CONFIGURED',
      'No AI provider configured (set OPENROUTER_API_KEY or AI_MODE=local|mock)',
      503
    )
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
      return createErrorResponse(
        c,
        'AI_NOT_CONFIGURED',
        'No AI provider configured (set OPENROUTER_API_KEY or AI_MODE=local|mock)',
        503
      )
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
