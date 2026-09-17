import { Hono } from 'hono';
import { db } from '../db';
import { components } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createApiResponse, createErrorResponse } from '../utils';
import { componentSchema } from '../../lib/validations';
import { createValidationMiddleware } from '../middleware/validation';

const router = new Hono<{ Variables: { validatedData?: unknown } }>();

// Get all components for a project
router.get('/project/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const allComponents = await db
      .select()
      .from(components)
      .where(eq(components.projectId, projectId))
      .all();
    return createApiResponse(c, allComponents);
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch components');
  }
});

// Get a single component
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const component = await db.select().from(components).where(eq(components.id, id)).get();

    if (!component) {
      return createErrorResponse(c, 'NOT_FOUND', 'Component not found', 404);
    }

    return createApiResponse(c, component);
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch component');
  }
});

// Create a new component
router.post(
  '/',
  createValidationMiddleware(componentSchema),
  async (c) => {
    try {
      const validatedData = c.get('validatedData') as typeof components.$inferInsert;
      const now = new Date();
      const newComponent = await db
        .insert(components)
        .values({
          ...validatedData,
          id: validatedData.id ?? crypto.randomUUID(),
          schema: validatedData.schema ?? {},
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
      return createApiResponse(c, newComponent, 201);
    } catch (error) {
      return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to create component');
    }
  }
);

// Update a component
router.put(
  '/:id',
  createValidationMiddleware(componentSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const validatedData = c.get('validatedData') as Partial<typeof components.$inferInsert>;
      const { id: _ignored, ...updates } = validatedData;

      const updatedComponent = await db
        .update(components)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(components.id, id!))
        .returning()
        .get();

      if (!updatedComponent) {
        return createErrorResponse(c, 'NOT_FOUND', 'Component not found', 404);
      }

      return createApiResponse(c, updatedComponent);
    } catch (error) {
      return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to update component');
    }
  }
);

// Delete a component
router.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const deletedComponent = await db
      .delete(components)
      .where(eq(components.id, id))
      .returning()
      .get();

    if (!deletedComponent) {
      return createErrorResponse(c, 'NOT_FOUND', 'Component not found', 404);
    }

    return createApiResponse(c, deletedComponent);
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to delete component');
  }
});

export default router;
