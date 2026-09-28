import { Hono } from 'hono'
import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { pages } from '../db/schema'
import { createApiResponse, createErrorResponse } from '../utils'
import { pageSchema } from '../../lib/validations'
import { createValidationMiddleware } from '../middleware/validation'
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware'
import { getOwnedProject } from '../services/projectService'

const router = new Hono<AuthEnv>()
router.use('*', authMiddleware())

function accountId(c: Context<AuthEnv>) {
  const account = c.get('account')
  if (!account) throw new Error('Authenticated account missing')
  return account.id
}

async function ownsProject(c: Context<AuthEnv>, projectId: string) {
  return Boolean(await getOwnedProject(projectId, accountId(c)))
}

router.get('/project/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId')
    if (!projectId || !(await ownsProject(c, projectId))) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)
    const allPages = await db.select().from(pages).where(eq(pages.projectId, projectId)).all()
    return createApiResponse(c, allPages)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch pages')
  }
})

router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    if (!id) return createErrorResponse(c, 'NOT_FOUND', 'Page not found', undefined, 404)
    const page = await db.select().from(pages).where(eq(pages.id, id)).get()
    if (!page || !(await ownsProject(c, page.projectId))) return createErrorResponse(c, 'NOT_FOUND', 'Page not found', undefined, 404)
    return createApiResponse(c, page)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch page')
  }
})

router.post('/', createValidationMiddleware(pageSchema), async (c) => {
  try {
    const validatedData = c.get('validatedData') as typeof pages.$inferInsert
    if (!(await ownsProject(c, validatedData.projectId))) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)
    const now = new Date()
    const newPage = await db
      .insert(pages)
      .values({ ...validatedData, id: validatedData.id ?? crypto.randomUUID(), schema: validatedData.schema ?? {}, createdAt: now, updatedAt: now })
      .returning()
      .get()
    return createApiResponse(c, newPage, 201)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to create page')
  }
})

router.put('/:id', createValidationMiddleware(pageSchema), async (c) => {
  try {
    const id = c.req.param('id')
    if (!id) return createErrorResponse(c, 'NOT_FOUND', 'Page not found', undefined, 404)
    const existing = await db.select().from(pages).where(eq(pages.id, id)).get()
    if (!existing || !(await ownsProject(c, existing.projectId))) return createErrorResponse(c, 'NOT_FOUND', 'Page not found', undefined, 404)
    const validatedData = c.get('validatedData') as Partial<typeof pages.$inferInsert>
    if (typeof validatedData.projectId === 'string' && !(await ownsProject(c, validatedData.projectId))) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)
    const { id: _ignored, ...updates } = validatedData
    const updatedPage = await db.update(pages).set({ ...updates, updatedAt: new Date() }).where(eq(pages.id, id)).returning().get()
    if (!updatedPage) return createErrorResponse(c, 'NOT_FOUND', 'Page not found', undefined, 404)
    return createApiResponse(c, updatedPage)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to update page')
  }
})

router.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    if (!id) return createErrorResponse(c, 'NOT_FOUND', 'Page not found', undefined, 404)
    const existing = await db.select().from(pages).where(eq(pages.id, id)).get()
    if (!existing || !(await ownsProject(c, existing.projectId))) return createErrorResponse(c, 'NOT_FOUND', 'Page not found', undefined, 404)
    const deletedPage = await db.delete(pages).where(eq(pages.id, id)).returning().get()
    if (!deletedPage) return createErrorResponse(c, 'NOT_FOUND', 'Page not found', undefined, 404)
    return createApiResponse(c, deletedPage)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to delete page')
  }
})

export default router
