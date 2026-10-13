import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { comments } from '../db/schema'

/**
 * Comment storage (WordPress parity, free).
 *
 * Comments are site-wide or page-scoped: `projectId` and `pageId` are both
 * optional so a comment can attach to a whole project or a specific page.
 * Status defaults to `approved`; moderation (pending/spam) is a later step.
 */

export interface CommentInput {
  projectId?: string | null
  pageId?: string | null
  author: string
  email?: string | null
  content: string
}

export interface CommentRow {
  id: string
  projectId: string | null
  pageId: string | null
  author: string
  email: string | null
  content: string
  status: string
  createdAt: Date
}

/** Create a comment and return the stored row. */
export async function createComment(input: CommentInput): Promise<CommentRow> {
  const row = await db
    .insert(comments)
    .values({
      id: crypto.randomUUID(),
      projectId: input.projectId ?? null,
      pageId: input.pageId ?? null,
      author: input.author,
      email: input.email ?? null,
      content: input.content,
      status: 'approved',
      createdAt: new Date(),
    })
    .returning()
    .get()
  return row
}

/** List approved comments for a page, newest first. */
export async function listCommentsByPage(pageId: string): Promise<CommentRow[]> {
  return db
    .select()
    .from(comments)
    .where(eq(comments.pageId, pageId))
    .orderBy(desc(comments.createdAt))
    .limit(200)
    .all()
}

/** List approved comments for a project, newest first. */
export async function listCommentsByProject(projectId: string): Promise<CommentRow[]> {
  return db
    .select()
    .from(comments)
    .where(eq(comments.projectId, projectId))
    .orderBy(desc(comments.createdAt))
    .limit(200)
    .all()
}
