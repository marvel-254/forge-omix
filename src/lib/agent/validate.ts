import { TaskSchema } from '../../server/validation'
import { verifyTaskGraph } from './tasks'

/**
 * Handoff-package validation (docs/08 §8.6): structural checks over the
 * emitted file set before an agent ever sees it — required files present,
 * tasks parse against the canonical schema, dependency graph resolves.
 */

export interface HandoffValidation {
  ok: boolean
  errors: string[]
}

const REQUIRED_FILES = [
  'package.json',
  'src/App.tsx',
  'src/main.tsx',
  'src/index.css',
  'src/components/ui.tsx',
  'tailwind.config.js',
  'AGENTS.md',
  '.builder/schema.json',
  '.builder/tasks.json',
  '.builder/sync-rules.json',
];

export function validateHandoff(files: Array<{ path: string; content: string }>): HandoffValidation {
  const errors: string[] = []
  const byPath = new Map(files.map((f) => [f.path, f.content]))

  for (const required of REQUIRED_FILES) {
    if (!byPath.has(required)) {
      errors.push(`missing required file: ${required}`)
    }
  }

  const tasksRaw = byPath.get('.builder/tasks.json')
  if (tasksRaw !== undefined) {
    let tasks: unknown = null
    try {
      tasks = JSON.parse(tasksRaw)
    } catch {
      errors.push('.builder/tasks.json is not valid JSON')
    }
    if (Array.isArray(tasks)) {
      tasks.forEach((task, index) => {
        // Handoff tasks carry full canonical fields.
        const result = TaskSchema.safeParse(task)
        if (!result.success) {
          const first = result.error.issues[0]
          errors.push(
            `.builder/tasks.json[${index}]: ${first?.path.join('.') || 'task'} ${first?.message || 'invalid'}`
          )
        }
      })
      const graphErrors = verifyTaskGraph(
        tasks as Array<{
          id: string
          title: string
          description: string
          type: 'feature' | 'integration' | 'test'
          status: 'todo'
          priority: 'critical' | 'high' | 'medium' | 'low'
          dependencies: string[]
          affectedScreens: string[]
          affectedComponents: string[]
          acceptanceCriteria: Array<{ description: string }>
          estimatedTokens: { input: number; output: number; total: number }
          labels: string[]
        }>
      )
      errors.push(...graphErrors.map((e) => `.builder/tasks.json: ${e}`))
    } else if (tasks !== null) {
      errors.push('.builder/tasks.json must be an array')
    }
  }

  const schemaRaw = byPath.get('.builder/schema.json')
  if (schemaRaw !== undefined) {
    try {
      JSON.parse(schemaRaw)
    } catch {
      errors.push('.builder/schema.json is not valid JSON')
    }
  }

  return { ok: errors.length === 0, errors }
}
