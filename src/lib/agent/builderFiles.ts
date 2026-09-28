import type { Page, Project } from '../../server/types/schema'
import type { GeneratedTask } from './tasks'

/**
 * `.builder/` handoff files (docs/08 §8.2 step 1, docs/07 §7.9 sync rules).
 * Machine-readable spec + task state the agent works from; agents update
 * `tasks.json` statuses as they complete work.
 */

export interface BuilderFile {
  path: string
  content: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n'
}

export function generateBuilderFiles(project: Project, tasks: GeneratedTask[]): BuilderFile[] {
  const record = asRecord(project)
  const pages = (Array.isArray(record.pages) ? record.pages : []) as Page[]
  const pageComponents = (page: Page): unknown[] => {
    const list = asRecord(page).components
    return Array.isArray(list) ? list : []
  }

  return [
    {
      path: '.builder/project.json',
      content: json({
        id: record.id,
        name: record.name,
        version: record.version,
        exportedAt: new Date().toISOString(),
        builder: { version: '0.1.0', platform: 'forge-omix' },
      }),
    },
    { path: '.builder/schema.json', content: json(record) },
    { path: '.builder/pages.json', content: json(pages) },
    {
      path: '.builder/components.json',
      content: json(pages.flatMap((p) => pageComponents(p))),
    },
    { path: '.builder/flows.json', content: json(record.flows ?? []) },
    { path: '.builder/design-tokens.json', content: json(record.designTokens ?? {}) },
    {
      path: '.builder/tasks.json',
      content: json(
        tasks.map((t) => ({
          ...t,
          // Handoff state agents mutate; everything else is spec.
          status: 'todo' as const,
        }))
      ),
    },
    {
      path: '.builder/sync-rules.json',
      content: json({
        protectedFiles: ['.builder/**', 'package.json', 'tailwind.config.js', 'src/index.css'],
        lastSyncAt: new Date().toISOString(),
      }),
    },
  ]
}
