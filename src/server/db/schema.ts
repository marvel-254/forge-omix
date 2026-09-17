import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version').notNull(),
  framework: text('framework').notNull().default('react'),
  cssStrategy: text('css_strategy').notNull().default('tailwind'),
  routerMode: text('router_mode').notNull().default('file'),
  settings: text('settings', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  path: text('path').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  schema: text('schema', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const components = sqliteTable('components', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  type: text('type').notNull(),
  name: text('name'),
  schema: text('schema', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const designTokens = sqliteTable('design_tokens', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  version: text('version').notNull(),
  colors: text('colors', { mode: 'json' }),
  typography: text('typography', { mode: 'json' }),
  spacing: text('spacing', { mode: 'json' }),
  radius: text('radius', { mode: 'json' }),
  shadows: text('shadows', { mode: 'json' }),
  breakpoints: text('breakpoints', { mode: 'json' }),
  motion: text('motion', { mode: 'json' }),
  zIndex: text('z_index', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const flows = sqliteTable('flows', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version').notNull(),
  steps: text('steps', { mode: 'json' }).notNull(),
  transitions: text('transitions', { mode: 'json' }),
  triggers: text('triggers', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  priority: text('priority').notNull(),
  dependencies: text('dependencies', { mode: 'json' }),
  affectedScreens: text('affected_screens', { mode: 'json' }),
  affectedComponents: text('affected_components', { mode: 'json' }),
  acceptanceCriteria: text('acceptance_criteria', { mode: 'json' }),
  estimatedTokens: text('estimated_tokens', { mode: 'json' }),
  assignee: text('assignee'),
  labels: text('labels', { mode: 'json' }),
  notes: text('notes'),
  context: text('context', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})

export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),
  name: text('name').notNull(),
  version: text('version').notNull(),
  author: text('author', { mode: 'json' }),
  license: text('license'),
  category: text('category'),
  tags: text('tags', { mode: 'json' }),
  preview: text('preview', { mode: 'json' }),
  variables: text('variables', { mode: 'json' }),
  dependencies: text('dependencies', { mode: 'json' }),
  schema: text('schema', { mode: 'json' }),
  importMetadata: text('import_metadata', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const schemaVersions = sqliteTable('schema_versions', {
  version: text('version').primaryKey(),
  name: text('name').notNull(),
  appliedAt: integer('applied_at', { mode: 'timestamp' }).notNull().default(new Date()),
  checksum: text('checksum'),
})
