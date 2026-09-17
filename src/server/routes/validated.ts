import { z } from 'zod'
import type { Hono, Context } from 'hono'
import { db } from '../db'
import { projects, pages, components, designTokens, flows, tasks, templates } from '../db/schema'
import { eq } from 'drizzle-orm'
import {
  ProjectSchema,
  PageSchema,
  ComponentSchema,
  FlowSchema,
  TaskSchema,
  TemplateSchema,
  DesignTokensSchema,
} from '../validation'

function withValidation(schema: z.ZodType<any>) {
  return async (c: Context, next: () => Promise<void>) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }
    const result = schema.safeParse(body)
    if (!result.success) {
      return c.json(
        { error: 'Invalid schema', issues: result.error.issues.map((i) => ({ path: i.path, message: i.message })) },
        400
      )
    }
    c.set('validated', result.data)
    await next()
  }
}

export function setupValidatedRoutes(app: Hono<{ Variables: { validated?: unknown } }>) {
  app.get('/api/projects', async (c) => {
    const all = await db.select().from(projects)
    return c.json({ data: all, count: all.length })
  })

  app.get('/api/projects/:id', async (c) => {
    const id = c.req.param('id') as string
    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    if (!project[0]) return c.json({ error: 'Not found' }, 404)

    const pg = await db.select().from(pages).where(eq(pages.projectId, id))
    const comps = await db.select().from(components).where(eq(components.projectId, id))
    const fls = await db.select().from(flows).where(eq(flows.projectId, id))
    const ts = await db.select().from(tasks).where(eq(tasks.projectId, id))
    const tmpls = await db.select().from(templates).where(eq(templates.projectId, id))
    const tokens = await db.select().from(designTokens).where(eq(designTokens.projectId, id))

    return c.json({
      data: {
        ...project[0],
        pages: pg.map((p) => p.schema),
        components: comps.map((c) => c.schema),
        flows: fls,
        tasks: ts,
        templates: tmpls,
        designTokens: tokens[0]
          ? {
              id: tokens[0].id,
              projectId: tokens[0].projectId,
              version: tokens[0].version,
              colors: tokens[0].colors,
              typography: tokens[0].typography,
              spacing: tokens[0].spacing,
              radius: tokens[0].radius,
              shadows: tokens[0].shadows,
              breakpoints: tokens[0].breakpoints,
              motion: tokens[0].motion,
              zIndex: tokens[0].zIndex,
              createdAt: tokens[0].createdAt,
              updatedAt: tokens[0].updatedAt,
            }
          : null,
      },
    })
  })

  app.post('/api/projects', withValidation(ProjectSchema), async (c) => {
    const validated = c.get('validated') as z.infer<typeof ProjectSchema>
    const existing = await db.select().from(projects).where(eq(projects.id, validated.id)).limit(1)
    if (existing.length) return c.json({ error: 'ID exists' }, 400)

    const nowTs = new Date()
    await db.insert(projects).values({
      id: validated.id,
      name: validated.name,
      description: validated.description ?? null,
      version: validated.version,
      framework: 'react',
      cssStrategy: 'tailwind',
      routerMode: 'file',
      createdAt: nowTs,
      updatedAt: nowTs,
    })
    return c.json({ data: { id: validated.id } }, 201)
  })

  app.put('/api/projects/:id', withValidation(ProjectSchema), async (c) => {
    const id = c.req.param('id') as string
    const validated = c.get('validated') as z.infer<typeof ProjectSchema>
    const existing = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    if (!existing.length) return c.json({ error: 'Not found' }, 404)

    await db.update(projects).set({
      name: validated.name,
      description: validated.description ?? null,
      version: validated.version,
      updatedAt: new Date(),
    }).where(eq(projects.id, id))
    return c.json({ data: { id, updated: true } })
  })

  app.delete('/api/projects/:id', async (c) => {
    const id = c.req.param('id') as string
    const existing = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    if (!existing.length) return c.json({ error: 'Not found' }, 404)

    await db.delete(projects).where(eq(projects.id, id))
    return c.json({ data: { id, deleted: true } })
  })

  app.get('/api/projects/:projectId/pages', async (c) => {
    const projectId = c.req.param('projectId') as string
    const all = await db.select().from(pages).where(eq(pages.projectId, projectId))
    return c.json({ data: all.map((p) => p.schema), count: all.length })
  })

  app.post('/api/projects/:projectId/pages', withValidation(PageSchema), async (c) => {
    const projectId = c.req.param('projectId') as string
    const validated = c.get('validated') as z.infer<typeof PageSchema>
    const existing = await db.select().from(pages).where(eq(pages.id, validated.id)).limit(1)
    if (existing.length) return c.json({ error: 'ID exists' }, 400)

    const nowTs = new Date()
    await db.insert(pages).values({
      id: validated.id,
      projectId,
      path: validated.path,
      title: validated.title,
      description: validated.description ?? null,
      schema: validated as unknown as object,
      createdAt: nowTs,
      updatedAt: nowTs,
    })
    return c.json({ data: { id: validated.id } }, 201)
  })

  app.get('/api/projects/:projectId/components', async (c) => {
    const projectId = c.req.param('projectId') as string
    const all = await db.select().from(components).where(eq(components.projectId, projectId))
    return c.json({ data: all.map((co) => co.schema), count: all.length })
  })

  app.post('/api/projects/:projectId/components', withValidation(ComponentSchema), async (c) => {
    const projectId = c.req.param('projectId') as string
    const validated = c.get('validated') as z.infer<typeof ComponentSchema>
    const existing = await db.select().from(components).where(eq(components.id, validated.id)).limit(1)
    if (existing.length) return c.json({ error: 'ID exists' }, 400)

    const nowTs = new Date()
    await db.insert(components).values({
      id: validated.id,
      projectId,
      type: validated.type,
      name: validated.name ?? null,
      schema: validated as unknown as object,
      createdAt: nowTs,
      updatedAt: nowTs,
    })
    return c.json({ data: { id: validated.id } }, 201)
  })

  app.get('/api/projects/:projectId/flows', async (c) => {
    const projectId = c.req.param('projectId') as string
    const all = await db.select().from(flows).where(eq(flows.projectId, projectId))
    return c.json({ data: all, count: all.length })
  })

  app.post('/api/projects/:projectId/flows', withValidation(FlowSchema), async (c) => {
    const projectId = c.req.param('projectId') as string
    const validated = c.get('validated') as z.infer<typeof FlowSchema>
    const existing = await db.select().from(flows).where(eq(flows.id, validated.id)).limit(1)
    if (existing.length) return c.json({ error: 'ID exists' }, 400)

    const nowTs = new Date()
    await db.insert(flows).values({
      id: validated.id,
      projectId,
      name: validated.name,
      description: validated.description ?? null,
      version: validated.version ?? '1.0.0',
      steps: validated.steps,
      transitions: validated.transitions ?? null,
      triggers: validated.triggers ?? null,
      createdAt: nowTs,
      updatedAt: nowTs,
    })
    return c.json({ data: { id: validated.id } }, 201)
  })

  app.get('/api/projects/:projectId/tasks', async (c) => {
    const projectId = c.req.param('projectId') as string
    const all = await db.select().from(tasks).where(eq(tasks.projectId, projectId))
    return c.json({
      data: all.map((t) => ({
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        description: t.description,
        type: t.type,
        status: t.status,
        priority: t.priority,
        dependencies: t.dependencies,
        affectedScreens: t.affectedScreens,
        affectedComponents: t.affectedComponents,
        acceptanceCriteria: t.acceptanceCriteria,
        estimatedTokens: t.estimatedTokens,
        assignee: t.assignee,
        labels: t.labels,
        notes: t.notes,
        context: t.context,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        completedAt: t.completedAt,
      })),
      count: all.length,
    })
  })

  app.post('/api/projects/:projectId/tasks', withValidation(TaskSchema), async (c) => {
    const projectId = c.req.param('projectId') as string
    const validated = c.get('validated') as z.infer<typeof TaskSchema>
    const existing = await db.select().from(tasks).where(eq(tasks.id, validated.id)).limit(1)
    if (existing.length) return c.json({ error: 'ID exists' }, 400)

    const nowTs = new Date()
    await db.insert(tasks).values({
      id: validated.id,
      projectId,
      title: validated.title,
      description: validated.description,
      type: validated.type,
      status: validated.status,
      priority: validated.priority,
      dependencies: validated.dependencies ?? null,
      affectedScreens: validated.affectedScreens ?? null,
      affectedComponents: validated.affectedComponents ?? null,
      acceptanceCriteria: validated.acceptanceCriteria ?? null,
      estimatedTokens: validated.estimatedTokens ?? null,
      assignee: validated.assignee ?? null,
      labels: validated.labels ?? null,
      notes: validated.notes ?? null,
      context: validated.context ?? null,
      createdAt: nowTs,
      updatedAt: nowTs,
      completedAt: validated.completedAt ? new Date(validated.completedAt) : null,
    })
    return c.json({ data: { id: validated.id } }, 201)
  })

  app.get('/api/projects/:projectId/templates', async (c) => {
    const projectId = c.req.param('projectId') as string
    const all = await db.select().from(templates).where(eq(templates.projectId, projectId))
    return c.json({ data: all, count: all.length })
  })

  app.post('/api/templates/import', withValidation(TemplateSchema), async (c) => {
    const validated = c.get('validated') as z.infer<typeof TemplateSchema>
    const existing = await db.select().from(templates).where(eq(templates.id, validated.id)).limit(1)
    if (existing.length) return c.json({ error: 'ID exists' }, 400)

    const nowTs = new Date()
    await db.insert(templates).values({
      id: validated.id,
      projectId: null,
      name: validated.name,
      version: validated.version,
      author: validated.author ?? null,
      license: validated.license ?? null,
      category: validated.category ?? null,
      tags: validated.tags ?? null,
      preview: validated.preview ?? null,
      variables: validated.variables ?? null,
      dependencies: validated.dependencies ?? null,
      schema: validated.schema ?? null,
      importMetadata: validated.importMetadata ?? null,
      createdAt: nowTs,
      updatedAt: nowTs,
    })
    return c.json({ data: { id: validated.id } }, 201)
  })

  app.get('/api/projects/:projectId/design-tokens', async (c) => {
    const projectId = c.req.param('projectId') as string
    const all = await db.select().from(designTokens).where(eq(designTokens.projectId, projectId))
    return c.json({ data: all, count: all.length })
  })

  app.put('/api/projects/:projectId/design-tokens', withValidation(DesignTokensSchema), async (c) => {
    const projectId = c.req.param('projectId') as string
    const validated = c.get('validated') as z.infer<typeof DesignTokensSchema>
    const nowTs = new Date()

    const existing = await db
      .select()
      .from(designTokens)
      .where(eq(designTokens.projectId, projectId))
      .limit(1)

    if (existing.length) {
      await db
        .update(designTokens)
        .set({
          colors: validated.colors ?? null,
          typography: validated.typography ?? null,
          spacing: validated.spacing ?? null,
          radius: validated.radius ?? null,
          shadows: validated.shadows ?? null,
          breakpoints: validated.breakpoints ?? null,
          motion: validated.motion ?? null,
          zIndex: validated.zIndex ?? null,
          updatedAt: nowTs,
        })
        .where(eq(designTokens.projectId, projectId))
    } else {
      await db.insert(designTokens).values({
        id: `dt_${projectId}`,
        projectId,
        version: '1.0.0',
        colors: validated.colors ?? null,
        typography: validated.typography ?? null,
        spacing: validated.spacing ?? null,
        radius: validated.radius ?? null,
        shadows: validated.shadows ?? null,
        breakpoints: validated.breakpoints ?? null,
        motion: validated.motion ?? null,
        zIndex: validated.zIndex ?? null,
        createdAt: nowTs,
        updatedAt: nowTs,
      })
    }

    return c.json({ data: { updated: true } })
  })
}
