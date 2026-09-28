import { describe, it, expect } from 'vitest'
import { estimateTokens, generateTasks, verifyTaskGraph } from '@/lib/agent/tasks'
import { generateAgentsMd } from '@/lib/agent/agentsMd'
import { generateBuilderFiles } from '@/lib/agent/builderFiles'
import { validateHandoff } from '@/lib/agent/validate'
import { generateProject } from '@/lib/codegen/project'
import { TaskSchema } from '@server/validation'
import type { Project } from '@/server/types/schema'

const project = {
  id: 'proj_agent1',
  name: 'Agent App',
  version: '1.0.0',
  pages: [
    {
      id: 'page_home',
      path: '/',
      title: 'Home',
      components: [
        { id: 'comp_nav1', type: 'Navbar', props: { logo: 'A', links: [] } },
        { id: 'comp_btn1', type: 'Button', props: { label: 'Go' } },
      ],
    },
    {
      id: 'page_dash',
      path: '/dashboard',
      title: 'Dashboard',
      components: [{ id: 'comp_btn2', type: 'Button', props: { label: 'Save' } }],
    },
  ],
  components: [],
  designTokens: { colors: { primary: '#3B82F6' } },
} as unknown as Project

describe('generateTasks', () => {
  it('orders foundation → components → pages → integration → qa', () => {
    const ids = generateTasks(project).map((t) => t.id)
    expect(ids[0]).toBe('task_foundation')
    expect(ids).toContain('task_component_navbar')
    expect(ids).toContain('task_component_button')
    expect(ids).toContain('task_page_home')
    expect(ids).toContain('task_page_dashboard')
    expect(ids[ids.length - 2]).toBe('task_integration')
    expect(ids[ids.length - 1]).toBe('task_quality')
  })

  it('links page tasks to their component tasks', () => {
    const tasks = generateTasks(project)
    const home = tasks.find((t) => t.id === 'task_page_home')!
    expect(home.dependencies).toContain('task_foundation')
    expect(home.dependencies).toContain('task_component_navbar')
    expect(home.dependencies).toContain('task_component_button')
    expect(home.affectedScreens).toEqual(['page_home'])
    expect(home.affectedComponents).toEqual(['comp_nav1', 'comp_btn1'])
  })

  it('produces canonical-valid tasks with estimates', () => {
    for (const task of generateTasks(project)) {
      expect(TaskSchema.safeParse(task).success, task.id).toBe(true)
      expect(task.estimatedTokens.total).toBeGreaterThan(0)
    }
    expect(verifyTaskGraph(generateTasks(project))).toEqual([])
  })

  it('handles empty projects', () => {
    const tasks = generateTasks({ ...project, pages: [] } as unknown as Project)
    const ids = tasks.map((t) => t.id)
    expect(ids).toEqual(['task_foundation', 'task_integration', 'task_quality'])
    expect(verifyTaskGraph(tasks)).toEqual([])
  })

  it('estimates scale with content', () => {
    const small = estimateTokens({ a: 1 })
    const big = estimateTokens({ a: 'x'.repeat(10000) })
    expect(big.total).toBeGreaterThan(small.total)
  })
})

describe('generateAgentsMd', () => {
  it('covers the §8.3 structure with real counts', () => {
    const tasks = generateTasks(project)
    const md = generateAgentsMd({
      project,
      files: [{ path: 'src/App.tsx' }, { path: 'AGENTS.md' }],
      tasks,
    })
    expect(md).toContain('# Project: Agent App')
    expect(md).toContain('**Total Pages:** 2')
    expect(md).toContain('**Total Components:** 3')
    expect(md).toContain('| / | Home |')
    expect(md).toContain('### task_page_home: Build Home page')
    expect(md).toContain('### Button')
    expect(md).toContain('## Files to NEVER Modify')
    expect(md).toContain('## Sync Rules')
    expect(md).toContain('.builder/tasks.json')
  })
})

describe('generateBuilderFiles', () => {
  it('emits the .builder/ set with todo statuses', () => {
    const files = generateBuilderFiles(project, generateTasks(project))
    const paths = files.map((f) => f.path)
    for (const expected of [
      '.builder/project.json',
      '.builder/schema.json',
      '.builder/pages.json',
      '.builder/components.json',
      '.builder/flows.json',
      '.builder/design-tokens.json',
      '.builder/tasks.json',
      '.builder/sync-rules.json',
    ]) {
      expect(paths).toContain(expected)
    }
    const tasks = JSON.parse(files.find((f) => f.path === '.builder/tasks.json')!.content)
    expect(tasks.length).toBeGreaterThan(0)
    expect(tasks.every((t: { status: string }) => t.status === 'todo')).toBe(true)
    const components = JSON.parse(
      files.find((f) => f.path === '.builder/components.json')!.content
    )
    expect(components).toHaveLength(3)
  })
})

describe('validateHandoff', () => {
  it('accepts the real generated output', () => {
    const files = generateProject(project)
    const result = validateHandoff(files)
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('reports missing files', () => {
    const files = generateProject(project).filter((f) => f.path !== 'src/App.tsx')
    const result = validateHandoff(files)
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('missing required file: src/App.tsx')
  })

  it('reports invalid tasks', () => {
    const files = generateProject(project).map((f) =>
      f.path === '.builder/tasks.json'
        ? { ...f, content: JSON.stringify([{ id: 'bad', title: 'x' }]) }
        : f
    )
    const result = validateHandoff(files)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('.builder/tasks.json[0]'))).toBe(true)
  })

  it('reports dangling dependencies', () => {
    expect(
      verifyTaskGraph([
        {
          id: 'task_a123',
          title: 'A',
          description: 'd',
          type: 'feature',
          status: 'todo',
          priority: 'medium',
          dependencies: ['task_missing'],
          affectedScreens: [],
          affectedComponents: [],
          acceptanceCriteria: [],
          estimatedTokens: { input: 1, output: 1, total: 2 },
          labels: [],
        },
      ])
    ).toEqual(['task_a123 depends on unknown task task_missing'])
  })
})
