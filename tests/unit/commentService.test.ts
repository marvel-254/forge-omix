import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Comment storage (WordPress parity, free): create and list comments scoped
 * to a page or project.
 */

describe('comment service', () => {
  let root: string
  let previousDb: string | undefined

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-comments-'))
    previousDb = process.env.DATABASE_URL
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { SchemaVersionManager } = await import('@server/services/versionService')
    await SchemaVersionManager.runPendingMigrations(join(process.cwd(), 'src/server/db/migrations'))
    // comments.project_id references projects(id), so seed a real project row.
    const { db } = await import('@server/db')
    const { projects } = await import('@server/db/schema')
    await db
      .insert(projects)
      .values({
        id: 'proj_1',
        name: 'Comment Test',
        version: '1.0.0',
        framework: 'react',
        cssStrategy: 'tailwind',
        routerMode: 'file',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run()
  })

  afterAll(async () => {
    if (previousDb === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previousDb
    await rm(root, { recursive: true, force: true })
  })

  it('creates and lists comments for a page', async () => {
    const { createComment, listCommentsByPage } = await import('@server/services/commentService')
    await createComment({
      projectId: 'proj_1',
      pageId: 'page_home',
      author: 'Ada',
      email: 'ada@example.com',
      content: 'First comment',
    })
    await createComment({
      projectId: 'proj_1',
      pageId: 'page_home',
      author: 'Grace',
      content: 'Second comment',
    })

    const comments = await listCommentsByPage('page_home')
    expect(comments).toHaveLength(2)
    // Newest first.
    expect(comments[0].author).toBe('Grace')
    expect(comments[1].author).toBe('Ada')
    expect(comments[0].content).toBe('Second comment')
  })

  it('scopes comments by page', async () => {
    const { createComment, listCommentsByPage } = await import('@server/services/commentService')
    await createComment({ projectId: 'proj_1', pageId: 'page_about', author: 'Lin', content: 'About comment' })
    const about = await listCommentsByPage('page_about')
    const home = await listCommentsByPage('page_home')
    expect(about).toHaveLength(1)
    expect(home).toHaveLength(2)
  })

  it('lists comments for a project', async () => {
    const { listCommentsByProject } = await import('@server/services/commentService')
    const comments = await listCommentsByProject('proj_1')
    expect(comments.length).toBeGreaterThanOrEqual(3)
  })
})
