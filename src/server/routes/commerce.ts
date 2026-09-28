import { Hono } from 'hono'
import type { Context } from 'hono'
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware'
import { createValidationMiddleware } from '../middleware/validation'
import {
  CommerceError,
  confirmCheckoutSession,
  createCheckoutSession,
  getCheckoutSession,
} from '../services/checkoutService'
import { listHostingPlans } from '../services/planCatalog'
import type { CheckoutSessionCreateInput } from '../validation/commerce'
import { checkoutSessionCreateSchema } from '../validation/commerce'
import { createApiResponse, createErrorResponse } from '../utils'

const router = new Hono<AuthEnv>()

function accountId(c: Context<AuthEnv>): string {
  const account = c.get('account')
  if (!account) throw new Error('Authenticated account missing')
  return account.id
}

function commerceErrorResponse(c: Context<AuthEnv>, error: unknown): Response {
  if (error instanceof CommerceError) {
    return createErrorResponse(c, error.code, error.message, undefined, error.status)
  }
  return createErrorResponse(c, 'INTERNAL_SERVER_ERROR', 'Commerce operation failed', undefined, 500)
}

router.get('/plans', (c) => createApiResponse(c, { plans: listHostingPlans() }))

router.use('/checkout/*', authMiddleware())

router.post(
  '/checkout/sessions',
  createValidationMiddleware(checkoutSessionCreateSchema),
  async (c) => {
    try {
      const checkout = await createCheckoutSession(
        accountId(c),
        c.get('validatedData') as CheckoutSessionCreateInput
      )
      return createApiResponse(c, { checkout }, 201)
    } catch (error) {
      return commerceErrorResponse(c, error)
    }
  }
)

router.get('/checkout/sessions/:id', async (c) => {
  try {
    const checkout = await getCheckoutSession(accountId(c), c.req.param('id') ?? '')
    if (!checkout) return createErrorResponse(c, 'NOT_FOUND', 'Checkout session not found', undefined, 404)
    return createApiResponse(c, { checkout })
  } catch (error) {
    return commerceErrorResponse(c, error)
  }
})

router.post('/checkout/sessions/:id/confirm', async (c) => {
  try {
    const checkout = await confirmCheckoutSession(accountId(c), c.req.param('id') ?? '')
    return createApiResponse(c, { checkout })
  } catch (error) {
    return commerceErrorResponse(c, error)
  }
})

export default router
