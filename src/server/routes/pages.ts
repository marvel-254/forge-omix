import { Hono } from 'hono';
import { db } from '../db';
import { pages } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createApiResponse, createErrorResponse } from '../utils';
import { pageSchema } from '../../lib/validations';
import { createValidationMiddleware } from '../middleware/validation';

const router = new Hono<{ Variables: { validatedData?: unknown } }>();

// Get all pages for a project
router.get('/project/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const allPages = await db.select().from(pages).where(eq(pages.projectId, projectId)).all();
    return createApiResponse(c, allPages);
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch pages');
  }
});

// Get a single page
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const page = await db.select().from(pages).where(eq(pages.id, id)).get();

    if (!page) {
      return createErrorResponse(c, 'NOT_FOUND', 'Page not found', 404);
    }

    return createApiResponse(c, page);
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch page');
  }
});

// Create a new page
router.post(
  '/',
  createValidationMiddleware(pageSchema),
  async (c) => {
    try {
      const validatedData = c.get('validatedData') as typeof pages.$inferInsert;
      const now = new Date();
      const newPage = await db
        .insert(pages)
        .values({
          ...validatedData,
          id: validatedData.id ?? crypto.randomUUID(),
          schema: validatedData.schema ?? {},
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
      return createApiResponse(c, newPage, 201);
    } catch (error) {
      return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to create page');
    }
  }
);

// Update a page
router.put(
  '/:id',
  createValidationMiddleware(pageSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const validatedData = c.get('validatedData') as Partial<typeof pages.$inferInsert>;
      const { id: _ignored, ...updates } = validatedData;

      const updatedPage = await db
        .update(pages)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(pages.id, id!))
        .returning()
        .get();

      if (!updatedPage) {
        return createErrorResponse(c, 'NOT_FOUND', 'Page not found', 404);
      }

      return createApiResponse(c, updatedPage);
    } catch (error) {
      return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to update page');
    }
  }
);

// Delete a page
router.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const deletedPage = await db
      .delete(pages)
      .where(eq(pages.id, id))
      .returning()
      .get();

    if (!deletedPage) {
      return createErrorResponse(c, 'NOT_FOUND', 'Page not found', 404);
    }

    return createApiResponse(c, deletedPage);
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to delete page');
  }
});

export default router;
