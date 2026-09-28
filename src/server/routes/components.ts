import { Hono } from 'hono'
import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { components } from '../db/schema'
import { createApiResponse, createErrorResponse } from '../utils'
import { componentSchema } from '../../lib/validations'
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
    const allComponents = await db.select().from(components).where(eq(components.projectId, projectId)).all()
    return createApiResponse(c, allComponents)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch components')
  }
})

router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    if (!id) return createErrorResponse(c, 'NOT_FOUND', 'Component not found', undefined, 404)
    const component = await db.select().from(components).where(eq(components.id, id)).get()
    if (!component || !(await ownsProject(c, component.projectId))) return createErrorResponse(c, 'NOT_FOUND', 'Component not found', undefined, 404)
    return createApiResponse(c, component)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch component')
  }
})

router.post('/', createValidationMiddleware(componentSchema), async (c) => {
  try {
    const validatedData = c.get('validatedData') as typeof components.$inferInsert
    if (!(await ownsProject(c, validatedData.projectId))) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)
    const now = new Date()
    const newComponent = await db
      .insert(components)
      .values({ ...validatedData, id: validatedData.id ?? crypto.randomUUID(), schema: validatedData.schema ?? {}, createdAt: now, updatedAt: now })
      .returning()
      .get()
    return createApiResponse(c, newComponent, 201)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to create component')
  }
})

router.put('/:id', createValidationMiddleware(componentSchema), async (c) => {
  try {
    const id = c.req.param('id')
    if (!id) return createErrorResponse(c, 'NOT_FOUND', 'Component not found', undefined, 404)
    const existing = await db.select().from(components).where(eq(components.id, id)).get()
    if (!existing || !(await ownsProject(c, existing.projectId))) return createErrorResponse(c, 'NOT_FOUND', 'Component not found', undefined, 404)
    const validatedData = c.get('validatedData') as Partial<typeof components.$inferInsert>
    if (typeof validatedData.projectId === 'string' && !(await ownsProject(c, validatedData.projectId))) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)
    const { id: _ignored, ...updates } = validatedData
    const updatedComponent = await db.update(components).set({ ...updates, updatedAt: new Date() }).where(eq(components.id, id)).returning().get()
    if (!updatedComponent) return createErrorResponse(c, 'NOT_FOUND', 'Component not found', undefined, 404)
    return createApiResponse(c, updatedComponent)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to update component')
  }
})

router.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    if (!id) return createErrorResponse(c, 'NOT_FOUND', 'Component not found', undefined, 404)
    const existing = await db.select().from(components).where(eq(components.id, id)).get()
    if (!existing || !(await ownsProject(c, existing.projectId))) return createErrorResponse(c, 'NOT_FOUND', 'Component not found', undefined, 404)
    const deletedComponent = await db.delete(components).where(eq(components.id, id)).returning().get()
    if (!deletedComponent) return createErrorResponse(c, 'NOT_FOUND', 'Component not found', undefined, 404)
    return createApiResponse(c, deletedComponent)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to delete component')
  }
})

export default router
