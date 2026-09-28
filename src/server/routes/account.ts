import { Hono } from 'hono'
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware'
import { getAccountOverview } from '../services/accountOverviewService'
import { createApiResponse, createErrorResponse } from '../utils'

const router = new Hono<AuthEnv>()
router.use('*', authMiddleware())

router.get('/overview', async (c) => {
  const account = c.get('account')
  if (!account) return createErrorResponse(c, 'UNAUTHORIZED', 'Authentication required', undefined, 401)

  try {
    return createApiResponse(c, await getAccountOverview(account))
  } catch {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch account overview', undefined, 500)
  }
})

export default router
