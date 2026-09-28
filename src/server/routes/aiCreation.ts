import { Hono } from 'hono'
import type { Context } from 'hono'
import { createApiResponse, createErrorResponse } from '../utils'
import { createValidationMiddleware } from '../middleware/validation'
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware'
import {
  aiCreationSessionCreateSchema,
  aiCreationSessionUpdateSchema,
} from '../validation/aiCreation'
import {
  AiCreationConflictError,
  AiCreationGenerationError,
  createAiCreationSession,
  generateAiCreationSession,
  getAiCreationSession,
  updateAiCreationSession,
} from '../services/aiCreationService'

const router = new Hono<AuthEnv>()
router.use('*', authMiddleware())

function accountId(c: Context<AuthEnv>): string {
  const account = c.get('account')
  if (!account) throw new Error('Authenticated account missing')
  return account.id
}

router.post('/sessions', createValidationMiddleware(aiCreationSessionCreateSchema), async (c) => {
  try {
    const session = await createAiCreationSession(
      accountId(c),
      c.get('validatedData') as import('../validation/aiCreation').AiCreationSessionInput
    )
    return createApiResponse(c, { session }, 201)
  } catch {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to create AI creation session', undefined, 500)
  }
})

router.get('/sessions/:id', async (c) => {
  try {
    const session = await getAiCreationSession(accountId(c), c.req.param('id') ?? '')
    if (!session) return createErrorResponse(c, 'NOT_FOUND', 'AI creation session not found', undefined, 404)
    return createApiResponse(c, { session })
  } catch {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch AI creation session', undefined, 500)
  }
})

router.patch('/sessions/:id', createValidationMiddleware(aiCreationSessionUpdateSchema), async (c) => {
  try {
    const session = await updateAiCreationSession(
      accountId(c),
      c.req.param('id') ?? '',
      c.get('validatedData') as import('../validation/aiCreation').AiCreationSessionUpdate
    )
    if (!session) return createErrorResponse(c, 'NOT_FOUND', 'AI creation session not found', undefined, 404)
    return createApiResponse(c, { session })
  } catch {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to update AI creation session', undefined, 500)
  }
})

router.post('/sessions/:id/generate', async (c) => {
  try {
    const session = await generateAiCreationSession(accountId(c), c.req.param('id') ?? '')
    if (!session) return createErrorResponse(c, 'NOT_FOUND', 'AI creation session not found', undefined, 404)
    return createApiResponse(c, { session })
  } catch (error) {
    if (error instanceof AiCreationConflictError) {
      return createErrorResponse(c, 'AI_GENERATION_CONFLICT', error.message, undefined, 409)
    }
    if (error instanceof AiCreationGenerationError) {
      return createErrorResponse(c, 'AI_GENERATION_FAILED', error.message, undefined, 500)
    }
    return createErrorResponse(c, 'INTERNAL_SERVER_ERROR', 'AI project generation failed', undefined, 500)
  }
})

export default router
