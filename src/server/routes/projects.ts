import { Hono } from 'hono'
import { db } from '../db'
import { projects } from '../db/schema'
import { eq } from 'drizzle-orm'
import { createApiResponse, createErrorResponse } from '../utils'
import { projectSchema } from '../../lib/validations'
import { createValidationMiddleware } from '../middleware/validation'
import {
  pickProjectColumns,
  writeProjectChildren,
  reassembleProject,
  type ServerProjectPayload,
} from '../services/projectService'

const router = new Hono<{ Variables: { validatedData?: unknown } }>()

// List projects
router.get('/', async (c) => {
  try {
    const allProjects = await db.select().from(projects).all()
    return createApiResponse(c, allProjects)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch projects')
  }
})

// Reassemble the canonical composite project across all tables.
router.get('/:id/project', async (c) => {
  try {
    const id = c.req.param('id')
    const composite = await reassembleProject(id)
    if (!composite) {
      return createErrorResponse(c, 'NOT_FOUND', 'Project not found', 404)
    }
    return createApiResponse(c, composite)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to reassemble project')
  }
})

// Get a single project row
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const project = await db.select().from(projects).where(eq(projects.id, id)).get()
    if (!project) {
      return createErrorResponse(c, 'NOT_FOUND', 'Project not found', 404)
    }
    return createApiResponse(c, project)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch project')
  }
})

// Create a project row (children go through the aggregate PUT or child routes)
router.post(
  '/',
  createValidationMiddleware(projectSchema),
  async (c) => {
    try {
      const validatedData = c.get('validatedData') as ServerProjectPayload
      const now = new Date()
      const id =
        typeof validatedData.id === 'string' && validatedData.id.length > 0
          ? validatedData.id
          : crypto.randomUUID()

      await db.insert(projects).values({
        ...pickProjectColumns(validatedData),
        id,
        version: typeof validatedData.version === 'string' ? validatedData.version : '1.0.0',
        createdAt: now,
        updatedAt: now,
      } as typeof projects.$inferInsert)

      // Persist any relational payloads supplied in the same request.
      await writeProjectChildren(id, validatedData)

      const composite = await reassembleProject(id)
      return createApiResponse(c, composite, 201)
    } catch (error) {
      return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to create project')
    }
  }
)

// Update a project row
router.put(
  '/:id',
  createValidationMiddleware(projectSchema),
  async (c) => {
    try {
      const id = c.req.param('id')
      if (typeof id !== 'string') {
        return createErrorResponse(c, 'BAD_REQUEST', 'Missing project id')
      }
      const validatedData = c.get('validatedData') as ServerProjectPayload
      const { id: _ignored, ...updates } = pickProjectColumns(validatedData)

      const updatedProject = await db
        .update(projects)
        .set({
          ...(Object.keys(updates).length ? updates : {}),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning()
        .get()

      if (!updatedProject) {
        return createErrorResponse(c, 'NOT_FOUND', 'Project not found', 404)
      }

      // Persist any relational payloads supplied in the same request.
      await writeProjectChildren(id, validatedData)

      const composite = await reassembleProject(id)
      return createApiResponse(c, composite)
    } catch (error) {
      return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to update project')
    }
  }
)

// Replace the full canonical project for an existing row (aggregate save).
router.put('/:id/project', async (c) => {
  try {
    const id = c.req.param('id')
    const existing = await db.select().from(projects).where(eq(projects.id, id)).get()
    if (!existing) {
      return createErrorResponse(c, 'NOT_FOUND', 'Project not found', 404)
    }

    const payload = (await c.req.json()) as ServerProjectPayload
    const { id: _ignored, ...updates } = pickProjectColumns(payload)

    await db
      .update(projects)
      .set({
        ...(Object.keys(updates).length ? updates : {}),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))

    await writeProjectChildren(id, payload)
    const composite = await reassembleProject(id)
    return createApiResponse(c, composite)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to save project')
  }
})

// Delete a project (child rows cascade by the DB's FK, and are also cleared explicitly)
router.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const deletedProject = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning()
      .get()

    if (!deletedProject) {
      return createErrorResponse(c, 'NOT_FOUND', 'Project not found', 404)
    }

    return createApiResponse(c, deletedProject)
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to delete project')
  }
})

export default router
