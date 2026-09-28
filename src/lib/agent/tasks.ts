import type { Component, Page, Project } from '../../server/types/schema'

/**
 * Task generation from schema (docs/08 §8.4–§8.5).
 *
 * Ordering: foundation → one task per used component type → one task per
 * page (depending on its components' tasks) → integration → QA.
 * Ids, dependencies, and affected refs follow the canonical task schema
 * (`task_` / `page_` / `comp_` patterns), NOT the illustrative TASK-001
 * style from the design doc.
 */

export interface GeneratedTask {
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
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function slug(s: string): string {
  const clean = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return clean || 'item'
}

/** Rough token estimate: ~4 chars per token over the referenced JSON. */
export function estimateTokens(payload: unknown, outputRatio = 3): { input: number; output: number; total: number } {
  const chars = JSON.stringify(payload ?? {}).length
  const input = Math.max(100, Math.ceil(chars / 4))
  const output = Math.max(100, Math.ceil(input * outputRatio))
  return { input, output, total: input + output }
}

function pageComponents(page: Page): Component[] {
  const record = asRecord(page)
  return Array.isArray(record.components) ? (record.components as Component[]) : []
}

function componentId(component: Component): string {
  return String(asRecord(component).id ?? '')
}

function componentType(component: Component): string {
  return String(asRecord(component).type ?? 'unknown')
}

/**
 * Generate an ordered, dependency-linked task list for a project.
 * Pure and deterministic (input order preserved throughout).
 */
export function generateTasks(project: Project): GeneratedTask[] {
  const record = asRecord(project)
  const pages = (Array.isArray(record.pages) ? record.pages : []) as Page[]
  const tasks: GeneratedTask[] = []

  const foundation: GeneratedTask = {
    id: 'task_foundation',
    title: 'Project foundation',
    description:
      'Install dependencies, configure Tailwind with design tokens, set up routing and base layout.',
    type: 'feature',
    status: 'todo',
    priority: 'critical',
    dependencies: [],
    affectedScreens: [],
    affectedComponents: [],
    acceptanceCriteria: [
      { description: 'Dependencies install cleanly' },
      { description: 'Dev server renders the home route' },
      { description: 'Tailwind reflects the design tokens' },
    ],
    estimatedTokens: estimateTokens({ pages: pages.length }),
    labels: ['foundation'],
  }
  tasks.push(foundation)

  // One task per used component type (first-seen order).
  const seenTypes: string[] = []
  const componentsByType = new Map<string, Component[]>()
  for (const page of pages) {
    for (const component of pageComponents(page)) {
      const type = componentType(component)
      if (!componentsByType.has(type)) {
        componentsByType.set(type, [])
        seenTypes.push(type)
      }
      componentsByType.get(type)!.push(component)
    }
  }
  const typeTaskId = (type: string): string => `task_component_${slug(type)}`
  for (const type of seenTypes) {
    const members = componentsByType.get(type) ?? []
    const ids = members.map(componentId).filter(Boolean)
    tasks.push({
      id: typeTaskId(type),
      title: `Implement ${type} component`,
      description: `Build the reusable ${type} component per the component specification (${members.length} instance${members.length === 1 ? '' : 's'}).`,
      type: 'feature',
      status: 'todo',
      priority: type === 'Input' || type === 'Button' ? 'high' : 'medium',
      dependencies: ['task_foundation'],
      affectedScreens: [],
      affectedComponents: ids,
      acceptanceCriteria: [
        { description: `${type} renders all configured variants` },
        { description: `${type} meets its accessibility requirements` },
      ],
      estimatedTokens: estimateTokens(members),
      labels: ['component', slug(type)],
    })
  }

  // One task per page, depending on its components' type tasks.
  // Keys derive from title/path (canonical ids need 4+ chars); duplicates
  // get a numeric suffix so ids stay unique.
  const usedPageKeys = new Set<string>()
  const pageKey = (title: string, path: string): string => {
    let base = slug(title) || (path === '/' ? 'home' : slug(path.split('/').filter(Boolean).pop() ?? ''))
    if (base.length < 4) base = `${base}_page`
    let key = base
    let n = 2
    while (usedPageKeys.has(key)) {
      key = `${base}_${n}`
      n += 1
    }
    usedPageKeys.add(key)
    return key
  };
  for (const page of pages) {
    const pageRecord = asRecord(page)
    const title = String(pageRecord.title ?? pageRecord.path ?? 'Page')
    const path = String(pageRecord.path ?? '/')
    const memberTypes = [...new Set(pageComponents(page).map(componentType))]
    const ids = pageComponents(page).map(componentId).filter(Boolean)
    tasks.push({
      id: `task_page_${pageKey(title, path)}`,
      title: `Build ${title} page`,
      description: `Assemble ${path} from: ${memberTypes.join(', ') || 'no components'}.`,
      type: 'feature',
      status: 'todo',
      priority: path === '/' ? 'high' : 'medium',
      dependencies: ['task_foundation', ...memberTypes.map(typeTaskId)],
      affectedScreens: typeof pageRecord.id === 'string' ? [String(pageRecord.id)] : [],
      affectedComponents: ids,
      acceptanceCriteria: [
        { description: `${path} renders all listed components` },
        { description: `Route ${path} resolves in the router` },
      ],
      estimatedTokens: estimateTokens(page),
      labels: ['page'],
    })
  }

  const pageTaskIds = tasks.filter((t) => t.id.startsWith('task_page_')).map((t) => t.id)
  tasks.push({
    id: 'task_integration',
    title: 'Form validation and API integration',
    description: 'Wire up forms with validation and connect API-driven components.',
    type: 'integration',
    status: 'todo',
    priority: 'medium',
    dependencies: pageTaskIds.length > 0 ? pageTaskIds : ['task_foundation'],
    affectedScreens: [],
    affectedComponents: [],
    acceptanceCriteria: [{ description: 'Forms validate input and show inline errors' }],
    estimatedTokens: estimateTokens({ pages: pageTaskIds }),
    labels: ['integration'],
  })

  const integrationId = 'task_integration'
  tasks.push({
    id: 'task_quality',
    title: 'Testing and quality assurance',
    description: 'Run unit tests, lint, typecheck, and the production build.',
    type: 'test',
    status: 'todo',
    priority: 'low',
    dependencies: tasks.map((t) => t.id).filter((id) => id !== integrationId && id !== 'task_quality'),
    affectedScreens: [],
    affectedComponents: [],
    acceptanceCriteria: [
      { description: 'vitest run passes' },
      { description: 'tsc --noEmit passes with strict mode' },
      { description: 'vite build succeeds' },
    ],
    estimatedTokens: estimateTokens({ scope: 'full-project' }, 1),
    labels: ['qa'],
  })

  return tasks
}

/** Verify every dependency id resolves to a generated task (acyclic by construction). */
export function verifyTaskGraph(tasks: GeneratedTask[]): string[] {
  const ids = new Set(tasks.map((t) => t.id))
  const errors: string[] = []
  const depsOf = (task: GeneratedTask): string[] =>
    Array.isArray(task.dependencies) ? task.dependencies.filter((d) => typeof d === 'string') : []
  for (const task of tasks) {
    if (!Array.isArray(task.dependencies)) {
      errors.push(`${String(task.id)} has malformed dependencies`)
      continue
    }
    for (const dep of depsOf(task)) {
      if (!ids.has(dep)) {
        errors.push(`${task.id} depends on unknown task ${dep}`)
      }
      if (dep === task.id) {
        errors.push(`${task.id} depends on itself`)
      }
    }
  }
  // Deterministic cycle check (construction order is topological).
  const order = new Map(tasks.map((t, i) => [t.id, i]))
  for (const task of tasks) {
    for (const dep of depsOf(task)) {
      if ((order.get(dep) ?? 0) > (order.get(task.id) ?? 0)) {
        errors.push(`${task.id} depends on later task ${dep}`)
      }
    }
  }
  return errors
}
