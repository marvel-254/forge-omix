import { Hono } from 'hono'
import type { Context } from 'hono'
import { createApiResponse, createErrorResponse } from '../utils'
import { createValidationMiddleware } from '../middleware/validation'
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware'
import {
  deploymentCreateSchema,
  deploymentListQuerySchema,
} from '../validation/deployments'
import {
  createDeployment,
  DeploymentError,
  getDeployment,
  getDeploymentLogs,
  listDeployments,
  publishDeployment,
  rollbackDeployment,
  startDeploymentBuild,
} from '../services/deploymentService'

const router = new Hono<AuthEnv>()
router.use('*', authMiddleware())

function accountId(c: Context<AuthEnv>): string {
  const account = c.get('account')
  if (!account) throw new Error('Authenticated account missing')
  return account.id
}

function deploymentErrorResponse(c: Context<AuthEnv>, error: unknown): Response {
  if (error instanceof DeploymentError) {
    return createErrorResponse(c, error.code, error.message, undefined, error.status)
  }
  return createErrorResponse(c, 'INTERNAL_SERVER_ERROR', 'Deployment operation failed', undefined, 500)
}

router.post('/', createValidationMiddleware(deploymentCreateSchema), async (c) => {
  try {
    const deployment = await createDeployment(
      accountId(c),
      c.get('validatedData') as import('../validation/deployments').DeploymentCreateInput
    )
    return createApiResponse(c, { deployment }, 201)
  } catch (error) {
    return deploymentErrorResponse(c, error)
  }
})

router.get('/', async (c) => {
  const parsed = deploymentListQuerySchema.safeParse({ projectId: c.req.query('projectId') })
  if (!parsed.success) {
    return createErrorResponse(c, 'VALIDATION_ERROR', 'projectId is required', undefined, 400)
  }

  try {
    const deployments = await listDeployments(accountId(c), parsed.data.projectId)
    return createApiResponse(c, { deployments })
  } catch (error) {
    return deploymentErrorResponse(c, error)
  }
})

router.get('/:id/logs', async (c) => {
  try {
    const deployment = await getDeployment(accountId(c), c.req.param('id') ?? '')
    if (!deployment) return createErrorResponse(c, 'NOT_FOUND', 'Deployment not found', undefined, 404)
    return createApiResponse(c, { logs: await getDeploymentLogs(accountId(c), deployment.id) })
  } catch (error) {
    return deploymentErrorResponse(c, error)
  }
})

router.get('/:id', async (c) => {
  try {
    const deployment = await getDeployment(accountId(c), c.req.param('id') ?? '')
    if (!deployment) return createErrorResponse(c, 'NOT_FOUND', 'Deployment not found', undefined, 404)
    return createApiResponse(c, { deployment })
  } catch (error) {
    return deploymentErrorResponse(c, error)
  }
})

router.post('/:id/build', async (c) => {
  try {
    return createApiResponse(c, {
      deployment: await startDeploymentBuild(accountId(c), c.req.param('id') ?? ''),
    })
  } catch (error) {
    return deploymentErrorResponse(c, error)
  }
})

router.post('/:id/publish', async (c) => {
  try {
    return createApiResponse(c, {
      deployment: await publishDeployment(accountId(c), c.req.param('id') ?? ''),
    })
  } catch (error) {
    return deploymentErrorResponse(c, error)
  }
})

router.post('/:id/rollback', async (c) => {
  try {
    return createApiResponse(c, {
      deployment: await rollbackDeployment(accountId(c), c.req.param('id') ?? ''),
    })
  } catch (error) {
    return deploymentErrorResponse(c, error)
  }
})

export default router
