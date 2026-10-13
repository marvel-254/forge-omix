import { Hono } from 'hono'
import { z } from 'zod'
import { createApiResponse, createErrorResponse } from '../utils'
import { createValidationMiddleware } from '../middleware/validation'
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware'
import {
  createComment,
  listCommentsByPage,
  listCommentsByProject,
} from '../services/commentService'

const router = new Hono<AuthEnv>()

const createSchema = z
  .object({
    projectId: z.string().max(100).optional().nullable(),
    pageId: z.string().max(100).optional().nullable(),
    author: z.string().min(1).max(100),
    email: z.string().email().max(200).optional().nullable(),
    content: z.string().min(1).max(2000),
  })
  .strict()

// Creating a comment requires an authenticated account (the site owner or a
// signed-in visitor). Listing is public so exported/embedded pages can render
// comments without auth.
router.post(
  '/',
  authMiddleware(),
  createValidationMiddleware(createSchema),
  async (c) => {
    try {
      const data = c.get('validatedData') as z.infer<typeof createSchema>
      const comment = await createComment({
        projectId: data.projectId ?? null,
        pageId: data.pageId ?? null,
        author: data.author,
        email: data.email ?? null,
        content: data.content,
      })
      return createApiResponse(c, { comment }, 201)
    } catch (error) {
      return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to create comment', undefined, 500)
    }
  }
)

router.get('/page/:pageId', async (c) => {
  try {
    const comments = await listCommentsByPage(c.req.param('pageId') ?? '')
    return createApiResponse(c, { comments })
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch comments', undefined, 500)
  }
})

router.get('/project/:projectId', async (c) => {
  try {
    const comments = await listCommentsByProject(c.req.param('projectId') ?? '')
    return createApiResponse(c, { comments })
  } catch (error) {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to fetch comments', undefined, 500)
  }
})

export default router
