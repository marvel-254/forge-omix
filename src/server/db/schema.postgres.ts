import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/** JSON values persisted in PostgreSQL jsonb columns. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' })
const json = (name: string) => jsonb(name).$type<JsonValue>()

// This parallel schema is for the PostgreSQL/Cloudflare deployment path.
// schema.ts and the existing migrations remain the local SQLite implementation
// until the application adapter and migration tooling are switched deliberately.
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
})

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  accountId: text('account_id').references(() => accounts.id),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version').notNull(),
  framework: text('framework').notNull().default('react'),
  cssStrategy: text('css_strategy').notNull().default('tailwind'),
  routerMode: text('router_mode').notNull().default('file'),
  settings: json('settings'),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
}, (table) => ({ accountIdIdx: index('projects_account_id_idx').on(table.accountId) }))

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: instant('expires_at').notNull(),
  createdAt: instant('created_at').notNull(),
  lastUsedAt: instant('last_used_at').notNull(),
}, (table) => ({
  accountIdIdx: index('sessions_account_id_idx').on(table.accountId),
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
}))

export const aiCreationSessions = pgTable('ai_creation_sessions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  status: text('status').notNull().default('draft'),
  step: text('step').notNull().default('brief'),
  brief: text('brief').notNull(),
  projectName: text('project_name').notNull(),
  clarifications: json('clarifications').notNull(),
  assets: json('assets').notNull(),
  generatedProject: json('generated_project'),
  error: text('error'),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
}, (table) => ({
  accountIdIdx: index('ai_creation_sessions_account_id_idx').on(table.accountId),
  statusIdx: index('ai_creation_sessions_status_idx').on(table.status),
}))

export const pages = pgTable('pages', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  path: text('path').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  schema: json('schema').notNull(),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
})

export const components = pgTable('components', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  type: text('type').notNull(),
  name: text('name'),
  schema: json('schema').notNull(),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
})

export const designTokens = pgTable('design_tokens', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  version: text('version').notNull(),
  colors: json('colors'),
  typography: json('typography'),
  spacing: json('spacing'),
  radius: json('radius'),
  shadows: json('shadows'),
  breakpoints: json('breakpoints'),
  motion: json('motion'),
  zIndex: json('z_index'),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
})

export const flows = pgTable('flows', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version').notNull(),
  steps: json('steps').notNull(),
  transitions: json('transitions'),
  triggers: json('triggers'),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
})

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  priority: text('priority').notNull(),
  dependencies: json('dependencies'),
  affectedScreens: json('affected_screens'),
  affectedComponents: json('affected_components'),
  acceptanceCriteria: json('acceptance_criteria'),
  estimatedTokens: json('estimated_tokens'),
  assignee: text('assignee'),
  labels: json('labels'),
  notes: text('notes'),
  context: json('context'),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
  completedAt: instant('completed_at'),
})

export const templates = pgTable('templates', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),
  name: text('name').notNull(),
  version: text('version').notNull(),
  author: json('author'),
  license: text('license'),
  category: text('category'),
  tags: json('tags'),
  preview: json('preview'),
  variables: json('variables'),
  dependencies: json('dependencies'),
  schema: json('schema'),
  importMetadata: json('import_metadata'),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
})

export const deployments = pgTable('deployments', {
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
  metadata: json('metadata'),
  startedAt: instant('started_at'),
  completedAt: instant('completed_at'),
  publishedAt: instant('published_at'),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
}, (table) => ({
  accountProjectIdx: index('deployments_account_project_idx').on(table.accountId, table.projectId),
  projectStatusIdx: index('deployments_project_status_idx').on(table.projectId, table.status),
}))

export const deploymentLogs = pgTable('deployment_logs', {
  id: text('id').primaryKey(),
  deploymentId: text('deployment_id').notNull().references(() => deployments.id),
  accountId: text('account_id').notNull().references(() => accounts.id),
  event: text('event').notNull(),
  message: text('message').notNull(),
  metadata: json('metadata'),
  createdAt: instant('created_at').notNull(),
}, (table) => ({
  deploymentCreatedIdx: index('deployment_logs_deployment_created_idx').on(table.deploymentId, table.createdAt),
  accountIdx: index('deployment_logs_account_idx').on(table.accountId),
}))

export const checkoutSessions = pgTable('checkout_sessions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  projectId: text('project_id').notNull().references(() => projects.id),
  planId: text('plan_id').notNull(),
  planSnapshot: json('plan_snapshot').notNull(),
  termMonths: integer('term_months').notNull(),
  status: text('status').notNull().default('draft'),
  promotionalTotal: integer('promotional_total').notNull(),
  renewalTotal: integer('renewal_total').notNull(),
  currency: text('currency').notNull(),
  paymentReference: text('payment_reference'),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
}, (table) => ({
  termMonthsCheck: check('checkout_sessions_term_months_check', sql`${table.termMonths} IN (12, 36)`),
  statusCheck: check('checkout_sessions_status_check', sql`${table.status} IN ('draft', 'pending_payment', 'completed', 'cancelled')`),
  promotionalTotalCheck: check('checkout_sessions_promotional_total_check', sql`${table.promotionalTotal} >= 0`),
  renewalTotalCheck: check('checkout_sessions_renewal_total_check', sql`${table.renewalTotal} >= 0`),
  accountCreatedIdx: index('checkout_sessions_account_created_idx').on(table.accountId, table.createdAt),
  projectIdx: index('checkout_sessions_project_idx').on(table.projectId),
}))

export const domains = pgTable('domains', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('available'),
  registration: json('registration').notNull(),
  hostingConnection: json('hosting_connection'),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
}, (table) => ({
  statusCheck: check('domains_status_check', sql`${table.status} IN ('searching', 'available', 'reserved', 'pending', 'registered', 'connected', 'renewal_due', 'expiring', 'expired')`),
  accountCreatedIdx: index('domains_account_created_idx').on(table.accountId, table.createdAt),
  nameIdx: index('domains_name_idx').on(table.name),
}))

export const feedback = pgTable('feedback', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  message: text('message').notNull(),
  contact: text('contact'),
  appVersion: text('app_version'),
  accountId: text('account_id').references(() => accounts.id),
  createdAt: instant('created_at').notNull(),
}, (table) => ({ accountIdIdx: index('feedback_account_id_idx').on(table.accountId) }))

export const supportTickets = pgTable('support_tickets', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  subject: text('subject').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull().default('normal'),
  status: text('status').notNull().default('open'),
  assignedTo: text('assigned_to').references(() => accounts.id),
  createdAt: instant('created_at').notNull(),
  updatedAt: instant('updated_at').notNull(),
  closedAt: instant('closed_at'),
}, (table) => ({
  priorityCheck: check('support_tickets_priority_check', sql`${table.priority} IN ('low', 'normal', 'high', 'urgent')`),
  statusCheck: check('support_tickets_status_check', sql`${table.status} IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')`),
  accountUpdatedIdx: index('support_tickets_account_updated_idx').on(table.accountId, table.updatedAt),
  statusUpdatedIdx: index('support_tickets_status_updated_idx').on(table.status, table.updatedAt),
}))

export const supportMessages = pgTable('support_messages', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull().references(() => supportTickets.id),
  accountId: text('account_id').notNull().references(() => accounts.id),
  body: text('body').notNull(),
  internal: boolean('internal').notNull().default(false),
  createdAt: instant('created_at').notNull(),
}, (table) => ({
  ticketCreatedIdx: index('support_messages_ticket_created_idx').on(table.ticketId, table.createdAt),
}))

export const schemaVersions = pgTable('schema_versions', {
  version: text('version').primaryKey(),
  name: text('name').notNull(),
  appliedAt: instant('applied_at').notNull().defaultNow(),
  checksum: text('checksum'),
  state: text('state').notNull().default('applied'),
})

// Keep the same name for code that imports the existing row type.
export type AuthAccount = typeof accounts.$inferSelect
export type AiCreationSessionRow = typeof aiCreationSessions.$inferSelect
export type DeploymentRow = typeof deployments.$inferSelect
export type DeploymentLogRow = typeof deploymentLogs.$inferSelect
export type CheckoutSessionRow = typeof checkoutSessions.$inferSelect
export type DomainRow = typeof domains.$inferSelect
