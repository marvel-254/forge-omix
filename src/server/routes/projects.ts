import { Hono } from 'hono'
import type { Context } from 'hono'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { projects } from '../db/schema'
import { createApiResponse, createErrorResponse } from '../utils'
import { projectSchema } from '../../lib/validations'
import { createValidationMiddleware } from '../middleware/validation'
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware'
import {
  getOwnedProject,
  pickProjectColumns,
  writeProjectChildren,
  reassembleProject,
  type ServerProjectPayload,
} from '../services/projectService'
import { generateSiteArchive, canRunInlineBuild } from '../services/buildService'

const router = new Hono<AuthEnv>()
router.use('*', authMiddleware())

function accountId(c: Context<AuthEnv>) {
  const account = c.get('account')
  if (!account) throw new Error('Authenticated account missing')
  return account.id
}

router.get('/', async (c) => {
  try {
    const allProjects = await db.select().from(projects).where(eq(projects.accountId, accountId(c))).all()
    return createApiResponse(c, allProjects)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch projects')
  }
})

router.get('/:id/project', async (c) => {
  try {
    const composite = await reassembleProject(c.req.param('id'), accountId(c))
    if (!composite) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)
    return createApiResponse(c, composite)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to reassemble project')
  }
})

router.get('/:id', async (c) => {
  try {
    const project = await getOwnedProject(c.req.param('id'), accountId(c))
    if (!project) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)
    return createApiResponse(c, project)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch project')
  }
})

router.post('/', createValidationMiddleware(projectSchema), async (c) => {
  try {
    const validatedData = c.get('validatedData') as ServerProjectPayload
    const now = new Date()
    const id = typeof validatedData.id === 'string' && validatedData.id.length > 0 ? validatedData.id : crypto.randomUUID()

    await db.insert(projects).values({
      ...pickProjectColumns(validatedData),
      id,
      accountId: accountId(c),
      version: typeof validatedData.version === 'string' ? validatedData.version : '1.0.0',
      createdAt: now,
      updatedAt: now,
    } as typeof projects.$inferInsert)

    await writeProjectChildren(id, validatedData)
    const composite = await reassembleProject(id, accountId(c))
    return createApiResponse(c, composite, 201)
  } catch (error) {
    console.error('[POST /api/projects] failed:', error)
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to create project')
  }
})

router.put('/:id', createValidationMiddleware(projectSchema), async (c) => {
  try {
    const id = c.req.param('id')
    if (!id) return createErrorResponse(c, 'BAD_REQUEST', 'Missing project id')
    const validatedData = c.get('validatedData') as ServerProjectPayload
    const { id: _ignored, ...updates } = pickProjectColumns(validatedData)
    const updatedProject = await db
      .update(projects)
      .set({ ...(Object.keys(updates).length ? updates : {}), updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.accountId, accountId(c))))
      .returning()
      .get()

    if (!updatedProject) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)
    await writeProjectChildren(id, validatedData)
    return createApiResponse(c, await reassembleProject(id, accountId(c)))
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to update project')
  }
})

router.put('/:id/project', createValidationMiddleware(projectSchema), async (c) => {
  try {
    const id = c.req.param('id')
    if (!id) return createErrorResponse(c, 'BAD_REQUEST', 'Missing project id')
    const existing = await getOwnedProject(id, accountId(c))
    if (!existing) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)

    const payload = c.get('validatedData') as ServerProjectPayload
    const { id: _ignored, ...updates } = pickProjectColumns(payload)
    await db
      .update(projects)
      .set({ ...(Object.keys(updates).length ? updates : {}), updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.accountId, accountId(c))))
    await writeProjectChildren(id, payload)
    return createApiResponse(c, await reassembleProject(id, accountId(c)))
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to save project')
  }
})

router.delete('/:id', async (c) => {
  try {
    const deletedProject = await db
      .delete(projects)
      .where(and(eq(projects.id, c.req.param('id')), eq(projects.accountId, accountId(c))))
      .returning()
      .get()
    if (!deletedProject) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)
    return createApiResponse(c, deletedProject)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to delete project')
  }
})

/** Export a saved project as a deployable source archive (zip). */
router.post('/:id/export', async (c) => {
  try {
    const project = await reassembleProject(c.req.param('id'), accountId(c))
    if (!project) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)
    const result = await generateSiteArchive(project, { runBuild: false })
    return createApiResponse(c, result)
  } catch (error) {
    return createErrorResponse(c, 'BUILD_FAILED', 'Failed to export project')
  }
})

/** Build a saved project and return a production-ready archive (zip with dist/). */
router.post('/:id/build', async (c) => {
  try {
    const project = await reassembleProject(c.req.param('id'), accountId(c))
    if (!project) return createErrorResponse(c, 'NOT_FOUND', 'Project not found', undefined, 404)
    const result = await generateSiteArchive(project, { runBuild: canRunInlineBuild() })
    return createApiResponse(c, result)
  } catch (error) {
    return createErrorResponse(c, 'BUILD_FAILED', 'Failed to build project')
  }
})

export default router
