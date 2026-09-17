import { db } from '../db'
import { projects, pages, components, designTokens, flows, tasks, templates } from '../db/schema'
import { eq } from 'drizzle-orm'
import { readFile, writeFile } from 'fs/promises'
import { validate, ProjectSchema, TemplateSchema } from '../validation'

const DEFAULTS = {
  framework: 'react' as const,
  cssStrategy: 'tailwind' as const,
  routerMode: 'file' as const,
}

function now() {
  return new Date()
}

export class SchemaManager {
  static async exportProject(projectId: string, outputPath?: string) {
    const projectRow = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
    if (!projectRow[0]) throw new Error('Project not found')

    const project: Record<string, unknown> = { ...projectRow[0] }
    delete (project as { framework?: unknown }).framework
    delete (project as { cssStrategy?: unknown }).cssStrategy
    delete (project as { routerMode?: unknown }).routerMode

    const pg = await db.select().from(pages).where(eq(pages.projectId, projectId))
    const comps = await db.select().from(components).where(eq(components.projectId, projectId))
    const fls = await db.select().from(flows).where(eq(flows.projectId, projectId))
    const ts = await db.select().from(tasks).where(eq(tasks.projectId, projectId))
    const tmpls = await db.select().from(templates).where(eq(templates.projectId, projectId))
    const tokens = await db.select().from(designTokens).where(eq(designTokens.projectId, projectId))

    const fullProject = {
      $schema: 'https://forge-omix.io/schemas/project.schema.json',
      format: 'forge-omix-export',
      version: project.version ?? '1.0.0',
      exportedAt: now().toISOString(),
      builder: { version: '0.1.0', platform: 'server' },
      project: {
        ...project,
        pages: pg.map((p) => p.schema),
        components: comps.map((c) => c.schema),
        flows: fls,
        tasks: ts.map((t) => ({
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
    } as const

    const payload = JSON.stringify(fullProject, null, 2)
    if (outputPath) {
      await writeFile(outputPath, payload)
    }
    return { success: true, exported: fullProject }
  }

  static async importProject(filePath: string) {
    const raw = await readFile(filePath, 'utf-8')
    const data = JSON.parse(raw)
    const input = (data as { project?: unknown }).project ?? data

    const result = validate(ProjectSchema, input)
    if (!result.valid) throw new Error('Invalid schema: ' + result.errors?.message)

    const validated = result.data!
    const nowTs = now()

    await db.delete(tasks)
    await db.delete(flows)
    await db.delete(templates)
    await db.delete(designTokens)
    await db.delete(components)
    await db.delete(pages)
    await db.delete(projects)

    await db.insert(projects).values({
      id: validated.id,
      name: validated.name,
      description: validated.description ?? null,
      version: validated.version,
      ...DEFAULTS,
      createdAt: nowTs,
      updatedAt: nowTs,
    })

    for (const page of validated.pages || []) {
      await db.insert(pages).values({
        id: page.id,
        projectId: validated.id,
        path: page.path,
        title: page.title,
        description: page.description ?? null,
        schema: page as unknown as object,
        createdAt: nowTs,
        updatedAt: nowTs,
      })
    }

    for (const component of validated.components || []) {
      await db.insert(components).values({
        id: component.id,
        projectId: validated.id,
        type: component.type,
        name: component.name ?? null,
        schema: component,
        createdAt: nowTs,
        updatedAt: nowTs,
      })
    }

    for (const flow of validated.flows || []) {
      await db.insert(flows).values({
        id: flow.id,
        projectId: validated.id,
        name: flow.name,
        description: flow.description ?? null,
        version: flow.version ?? '1.0.0',
        steps: flow.steps,
        transitions: flow.transitions ?? null,
        triggers: flow.triggers ?? null,
        createdAt: nowTs,
        updatedAt: nowTs,
      })
    }

    for (const task of validated.tasks || []) {
      await db.insert(tasks).values({
        id: task.id,
        projectId: validated.id,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        priority: task.priority,
        dependencies: task.dependencies ?? null,
        affectedScreens: task.affectedScreens ?? null,
        affectedComponents: task.affectedComponents ?? null,
        acceptanceCriteria: task.acceptanceCriteria ?? null,
        estimatedTokens: task.estimatedTokens ?? null,
        assignee: task.assignee ?? null,
        labels: task.labels ?? null,
        notes: task.notes ?? null,
        context: task.context ?? null,
        createdAt: nowTs,
        updatedAt: nowTs,
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
      })
    }

    for (const template of validated.templates || []) {
      await db.insert(templates).values({
        id: template.id,
        projectId: validated.id,
        name: template.name,
        version: template.version,
        author: template.author ?? null,
        license: template.license ?? null,
        category: template.category ?? null,
        tags: template.tags ?? null,
        preview: template.preview ?? null,
        variables: template.variables ?? null,
        dependencies: template.dependencies ?? null,
        schema: template.schema ?? null,
        importMetadata: template.importMetadata ?? null,
        createdAt: nowTs,
        updatedAt: nowTs,
      })
    }

    if (validated.designTokens) {
      await db.insert(designTokens).values({
        id: `dt_${validated.id}`,
        projectId: validated.id,
        version: '1.0.0',
        colors: validated.designTokens.colors ?? null,
        typography: validated.designTokens.typography ?? null,
        spacing: validated.designTokens.spacing ?? null,
        radius: validated.designTokens.radius ?? null,
        shadows: validated.designTokens.shadows ?? null,
        breakpoints: validated.designTokens.breakpoints ?? null,
        motion: validated.designTokens.motion ?? null,
        zIndex: validated.designTokens.zIndex ?? null,
        createdAt: nowTs,
        updatedAt: nowTs,
      })
    }

    return { success: true, imported: validated }
  }

  static async exportTemplate(templateId: string, outputPath?: string) {
    const row = await db.select().from(templates).where(eq(templates.id, templateId)).limit(1)
    if (!row[0]) throw new Error('Template not found')
    const payload = JSON.stringify(row[0], null, 2)
    if (outputPath) await writeFile(outputPath, payload)
    return { success: true, exported: row[0] }
  }

  static async importTemplate(filePath: string) {
    const raw = await readFile(filePath, 'utf-8')
    const data = JSON.parse(raw)
    const result = validate(TemplateSchema, data)
    if (!result.valid) throw new Error('Invalid template: ' + result.errors?.message)
    const validated = result.data!
    const existing = await db.select().from(templates).where(eq(templates.id, validated.id)).limit(1)
    if (existing.length) throw new Error('Template ID already exists')

    const nowTs = now()
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

    return { success: true, imported: validated }
  }
}
