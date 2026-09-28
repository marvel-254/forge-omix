import { Hono } from 'hono'
import type { Context } from 'hono'
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware'
import {
  createQueryValidationMiddleware,
  createValidationMiddleware,
} from '../middleware/validation'
import {
  connectDomain,
  createDomain,
  disconnectDomain,
  DomainError,
  listDomains,
  registerDomain,
  searchDomains,
} from '../services/domainService'
import {
  domainConnectSchema,
  domainCreateSchema,
  domainSearchQuerySchema,
  type DomainConnectInput,
  type DomainCreateInput,
} from '../validation/commerce'
import { createApiResponse, createErrorResponse } from '../utils'

const router = new Hono<AuthEnv>()

function accountId(c: Context<AuthEnv>): string {
  const account = c.get('account')
  if (!account) throw new Error('Authenticated account missing')
  return account.id
}

function domainErrorResponse(c: Context<AuthEnv>, error: unknown): Response {
  if (error instanceof DomainError) {
    return createErrorResponse(c, error.code, error.message, undefined, error.status)
  }
  return createErrorResponse(c, 'INTERNAL_SERVER_ERROR', 'Domain operation failed', undefined, 500)
}

router.get('/search', createQueryValidationMiddleware(domainSearchQuerySchema), (c) => {
  const query = c.get('validatedQuery' as never) as { q: string }
  return createApiResponse(c, { results: searchDomains(query.q) })
})

router.use('*', authMiddleware())

router.get('/', async (c) => {
  try {
    return createApiResponse(c, { domains: await listDomains(accountId(c)) })
  } catch (error) {
    return domainErrorResponse(c, error)
  }
})

router.post('/', createValidationMiddleware(domainCreateSchema), async (c) => {
  try {
    const domain = await createDomain(
      accountId(c),
      c.get('validatedData') as DomainCreateInput
    )
    return createApiResponse(c, { domain }, 201)
  } catch (error) {
    return domainErrorResponse(c, error)
  }
})

router.post('/:id/connect', createValidationMiddleware(domainConnectSchema), async (c) => {
  try {
    const domain = await connectDomain(
      accountId(c),
      c.req.param('id') ?? '',
      c.get('validatedData') as DomainConnectInput
    )
    return createApiResponse(c, { domain })
  } catch (error) {
    return domainErrorResponse(c, error)
  }
})

router.post('/:id/disconnect', async (c) => {
  try {
    return createApiResponse(c, { domain: await disconnectDomain(accountId(c), c.req.param('id') ?? '') })
  } catch (error) {
    return domainErrorResponse(c, error)
  }
})

router.post('/:id/register', async (c) => {
  try {
    return createApiResponse(c, { domain: await registerDomain(accountId(c), c.req.param('id') ?? '') })
  } catch (error) {
    return domainErrorResponse(c, error)
  }
})

export default router
