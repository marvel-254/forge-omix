import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { feedback } from '../db/schema';
import { createApiResponse, createErrorResponse } from '../utils';
import { createValidationMiddleware } from '../middleware/validation';
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware';

const router = new Hono<AuthEnv>();
router.use('*', authMiddleware());

const submitSchema = z
  .object({
    kind: z.enum(['bug', 'idea', 'praise', 'other']),
    message: z.string().min(1).max(2000),
    contact: z.string().max(200).optional(),
    appVersion: z.string().max(50).optional(),
  })
  .strict();

function accountId(c: Context<AuthEnv>) {
  const account = c.get('account');
  if (!account) throw new Error('Authenticated account missing');
  return account.id;
}

router.post('/', createValidationMiddleware(submitSchema), async (c) => {
  try {
    const validatedData = c.get('validatedData') as z.infer<typeof submitSchema>;
    const row = await db
      .insert(feedback)
      .values({
        id: crypto.randomUUID(),
        kind: validatedData.kind,
        message: validatedData.message,
        contact: validatedData.contact ?? null,
        appVersion: validatedData.appVersion ?? null,
        accountId: accountId(c),
        createdAt: new Date(),
      })
      .returning()
      .get();
    return createApiResponse(c, { id: row.id }, 201);
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to save feedback');
  }
});

router.get('/', async (c) => {
  try {
    const rows = await db
      .select()
      .from(feedback)
      .where(eq(feedback.accountId, accountId(c)))
      .orderBy(desc(feedback.createdAt))
      .limit(100)
      .all();
    return createApiResponse(c, rows);
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch feedback');
  }
});

export default router;
