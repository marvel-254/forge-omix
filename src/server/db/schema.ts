import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' }).notNull(),
})

export type AuthAccount = typeof accounts.$inferSelect

export const aiCreationSessions = sqliteTable('ai_creation_sessions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  status: text('status').notNull().default('draft'),
  step: text('step').notNull().default('brief'),
  brief: text('brief').notNull(),
  projectName: text('project_name').notNull(),
  clarifications: text('clarifications', { mode: 'json' }).notNull(),
  assets: text('assets', { mode: 'json' }).notNull(),
  generatedProject: text('generated_project', { mode: 'json' }),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export type AiCreationSessionRow = typeof aiCreationSessions.$inferSelect

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  accountId: text('account_id').references(() => accounts.id),
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

export const deployments = sqliteTable('deployments', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  projectId: text('project_id').notNull().references(() => projects.id),
  environment: text('environment').notNull(),
  version: text('version'),
  status: text('status').notNull().default('queued'),
  failure: text('failure'),
  previewUrl: text('preview_url'),
  liveUrl: text('live_url'),
  commitHash: text('commit_hash'),
  commitMessage: text('commit_message'),
  commitAuthor: text('commit_author'),
  metadata: text('metadata', { mode: 'json' }),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export type DeploymentRow = typeof deployments.$inferSelect

export const deploymentLogs = sqliteTable('deployment_logs', {
  id: text('id').primaryKey(),
  deploymentId: text('deployment_id').notNull().references(() => deployments.id),
  accountId: text('account_id').notNull().references(() => accounts.id),
  event: text('event').notNull(),
  message: text('message').notNull(),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type DeploymentLogRow = typeof deploymentLogs.$inferSelect

export const checkoutSessions = sqliteTable('checkout_sessions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  projectId: text('project_id').notNull().references(() => projects.id),
  planId: text('plan_id').notNull(),
  planSnapshot: text('plan_snapshot', { mode: 'json' }).notNull(),
  termMonths: integer('term_months').notNull(),
  status: text('status').notNull().default('draft'),
  promotionalTotal: integer('promotional_total').notNull(),
  renewalTotal: integer('renewal_total').notNull(),
  currency: text('currency').notNull(),
  paymentReference: text('payment_reference'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export type CheckoutSessionRow = typeof checkoutSessions.$inferSelect

export const domains = sqliteTable('domains', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('available'),
  registration: text('registration', { mode: 'json' }).notNull(),
  hostingConnection: text('hosting_connection', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export type DomainRow = typeof domains.$inferSelect

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

export const feedback = sqliteTable('feedback', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  message: text('message').notNull(),
  contact: text('contact'),
  appVersion: text('app_version'),
  accountId: text('account_id').references(() => accounts.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export const supportTickets = sqliteTable('support_tickets', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  subject: text('subject').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull().default('normal'),
  status: text('status').notNull().default('open'),
  assignedTo: text('assigned_to').references(() => accounts.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  closedAt: integer('closed_at', { mode: 'timestamp_ms' }),
})

export const supportMessages = sqliteTable('support_messages', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull().references(() => supportTickets.id),
  accountId: text('account_id').notNull().references(() => accounts.id),
  body: text('body').notNull(),
  internal: integer('internal', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  projectId: text('project_id').references(() => projects.id),
  filename: text('filename').notNull(),
  storedName: text('stored_name').notNull(),
  mimeType: text('mime_type').notNull(),
  mediaType: text('media_type').notNull(),
  byteSize: integer('byte_size').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export const schemaVersions = sqliteTable('schema_versions', {
  version: text('version').primaryKey(),
  name: text('name').notNull(),
  appliedAt: integer('applied_at', { mode: 'timestamp' }).notNull().default(new Date()),
  checksum: text('checksum'),
})
