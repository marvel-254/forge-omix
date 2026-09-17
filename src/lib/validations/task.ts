import { z } from 'zod'

/**
 * Task schema for API validation.
 * Permissive: agent handoff tasks carry editor-managed metadata.
 */
export const taskSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(5000),
    type: z
      .enum(['feature', 'fix', 'refactor', 'style', 'test', 'docs', 'chore', 'research', 'design', 'integration'])
      .default('feature'),
    status: z.enum(['backlog', 'todo', 'in-progress', 'review', 'done', 'cancelled']).default('todo'),
    priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
    dependencies: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
    notes: z.string().max(5000).optional(),
  })
  .passthrough()

export type TaskInput = z.infer<typeof taskSchema>
