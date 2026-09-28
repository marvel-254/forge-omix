import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { deploymentLogs, deployments } from '../db/schema'
import { getOwnedProject } from './projectService'
import {
  DeploymentLogSchema,
  DeploymentSchema,
  type Deployment,
  type DeploymentCreateInput,
  type DeploymentLog,
} from '../validation/deployments'

export interface DeploymentAdapterResult {
  liveUrl: string
  previewUrl?: string
}

export interface DeploymentAdapter {
  publish(deployment: Deployment): Promise<DeploymentAdapterResult>
  rollback(deployment: Deployment): Promise<DeploymentAdapterResult>
}

let deploymentAdapter: DeploymentAdapter | null = null

export function getDeploymentAdapter(): DeploymentAdapter | null {
  return deploymentAdapter
}

export function setDeploymentAdapter(adapter: DeploymentAdapter | null): void {
  deploymentAdapter = adapter
}

export class DeploymentError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_FOUND'
      | 'INVALID_TRANSITION'
      | 'DEPLOY_ADAPTER_NOT_CONFIGURED'
      | 'DEPLOY_ADAPTER_FAILED',
    readonly status: 404 | 409 | 501 | 502
  ) {
    super(message)
    this.name = 'DeploymentError'
  }
}

function toIso(value: Date | null): string | null {
  return value?.toISOString() ?? null
}

function mapDeployment(row: typeof deployments.$inferSelect): Deployment {
  return DeploymentSchema.parse({
    id: row.id,
    accountId: row.accountId,
    projectId: row.projectId,
    environment: row.environment,
    version: row.version,
    status: row.status,
    failure: row.failure,
    previewUrl: row.previewUrl,
    liveUrl: row.liveUrl,
    commitHash: row.commitHash,
    commitMessage: row.commitMessage,
    commitAuthor: row.commitAuthor,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    startedAt: toIso(row.startedAt),
    completedAt: toIso(row.completedAt),
    publishedAt: toIso(row.publishedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })
}

function mapLog(row: typeof deploymentLogs.$inferSelect): DeploymentLog {
  return DeploymentLogSchema.parse({
    id: row.id,
    deploymentId: row.deploymentId,
    accountId: row.accountId,
    event: row.event,
    message: row.message,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  })
}

async function appendLog(
  deployment: typeof deployments.$inferSelect,
  event: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.insert(deploymentLogs).values({
    id: crypto.randomUUID(),
    deploymentId: deployment.id,
    accountId: deployment.accountId,
    event,
    message,
    metadata: metadata ?? null,
    createdAt: new Date(),
  })
}

export async function createDeployment(accountId: string, input: DeploymentCreateInput): Promise<Deployment> {
  const project = await getOwnedProject(input.projectId, accountId)
  if (!project) {
    throw new DeploymentError('Project not found', 'NOT_FOUND', 404)
  }

  const now = new Date()
  const row = await db
    .insert(deployments)
    .values({
      id: crypto.randomUUID(),
      accountId,
      projectId: project.id,
      environment: input.environment,
      version: input.version ?? project.version,
      status: 'queued',
      failure: null,
      previewUrl: null,
      liveUrl: null,
      commitHash: null,
      commitMessage: null,
      commitAuthor: null,
      metadata: null,
      startedAt: null,
      completedAt: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get()

  await appendLog(row, 'deployment.queued', 'Deployment queued', {
    environment: input.environment,
    version: input.version ?? project.version,
  })
  return mapDeployment(row)
}

export async function getDeployment(accountId: string, id: string): Promise<Deployment | null> {
  const row = await db
    .select()
    .from(deployments)
    .where(and(eq(deployments.id, id), eq(deployments.accountId, accountId)))
    .get()
  return row ? mapDeployment(row) : null
}

export async function listDeployments(
  accountId: string,
  projectId: string
): Promise<Deployment[]> {
  const project = await getOwnedProject(projectId, accountId)
  if (!project) throw new DeploymentError('Project not found', 'NOT_FOUND', 404)

  const rows = await db
    .select()
    .from(deployments)
    .where(and(eq(deployments.accountId, accountId), eq(deployments.projectId, projectId)))
    .orderBy(desc(deployments.createdAt))
    .all()
  return rows.map(mapDeployment)
}

export async function getDeploymentLogs(accountId: string, id: string): Promise<DeploymentLog[]> {
  const rows = await db
    .select()
    .from(deploymentLogs)
    .where(and(eq(deploymentLogs.deploymentId, id), eq(deploymentLogs.accountId, accountId)))
    .orderBy(deploymentLogs.createdAt)
    .all()
  return rows.map(mapLog)
}

export async function startDeploymentBuild(accountId: string, id: string): Promise<Deployment> {
  const existing = await getDeployment(accountId, id)
  if (!existing) throw new DeploymentError('Deployment not found', 'NOT_FOUND', 404)
  if (existing.status !== 'queued') {
    throw new DeploymentError('Only queued deployments can be built', 'INVALID_TRANSITION', 409)
  }

  const now = new Date()
  const row = await db
    .update(deployments)
    .set({ status: 'building', startedAt: now, updatedAt: now, failure: null })
    .where(and(eq(deployments.id, id), eq(deployments.accountId, accountId), eq(deployments.status, 'queued')))
    .returning()
    .get()
  if (!row) {
    throw new DeploymentError('Deployment build is no longer available', 'INVALID_TRANSITION', 409)
  }

  await appendLog(row, 'deployment.build_started', 'Build started')
  return mapDeployment(row)
}

async function updatePublishedDeployment(
  row: typeof deployments.$inferSelect,
  result: DeploymentAdapterResult,
  event: string,
  message: string
): Promise<Deployment> {
  const now = new Date()
  const updated = await db
    .update(deployments)
    .set({
      status: 'live',
      liveUrl: result.liveUrl,
      previewUrl: result.previewUrl ?? row.previewUrl,
      publishedAt: now,
      updatedAt: now,
      failure: null,
    })
    .where(and(eq(deployments.id, row.id), eq(deployments.accountId, row.accountId)))
    .returning()
    .get()
  if (!updated) throw new DeploymentError('Deployment not found', 'NOT_FOUND', 404)
  await appendLog(updated, event, message, { liveUrl: result.liveUrl })
  return mapDeployment(updated)
}

export async function publishDeployment(accountId: string, id: string): Promise<Deployment> {
  const existing = await getDeployment(accountId, id)
  if (!existing) throw new DeploymentError('Deployment not found', 'NOT_FOUND', 404)
  if (existing.status !== 'ready') {
    throw new DeploymentError('Only ready deployments can be published', 'INVALID_TRANSITION', 409)
  }

  const adapter = getDeploymentAdapter()
  if (!adapter) {
    throw new DeploymentError(
      'Deployment adapter is not configured',
      'DEPLOY_ADAPTER_NOT_CONFIGURED',
      501
    )
  }

  const row = await db
    .update(deployments)
    .set({ status: 'deploying', updatedAt: new Date(), failure: null })
    .where(and(eq(deployments.id, id), eq(deployments.accountId, accountId), eq(deployments.status, 'ready')))
    .returning()
    .get()
  if (!row) throw new DeploymentError('Deployment publish is no longer available', 'INVALID_TRANSITION', 409)
  await appendLog(row, 'deployment.publish_started', 'Publish started')

  try {
    const result = await adapter.publish(existing)
    if (!result.liveUrl) throw new Error('Deployment adapter did not return a live URL')
    return await updatePublishedDeployment(row, result, 'deployment.published', 'Deployment published')
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : 'Deployment adapter failed'
    const failed = await db
      .update(deployments)
      .set({ status: 'failed', failure: message, updatedAt: new Date() })
      .where(and(eq(deployments.id, id), eq(deployments.accountId, accountId)))
      .returning()
      .get()
    if (failed) await appendLog(failed, 'deployment.publish_failed', 'Publish failed', { failure: message })
    throw new DeploymentError(message, 'DEPLOY_ADAPTER_FAILED', 502)
  }
}

export async function rollbackDeployment(accountId: string, id: string): Promise<Deployment> {
  const existing = await getDeployment(accountId, id)
  if (!existing) throw new DeploymentError('Deployment not found', 'NOT_FOUND', 404)
  if (existing.status !== 'ready' && existing.status !== 'live') {
    throw new DeploymentError(
      'Only ready or live deployments can be rollback targets',
      'INVALID_TRANSITION',
      409
    )
  }

  const adapter = getDeploymentAdapter()
  if (!adapter) {
    throw new DeploymentError(
      'Deployment adapter is not configured',
      'DEPLOY_ADAPTER_NOT_CONFIGURED',
      501
    )
  }

  try {
    const result = await adapter.rollback(existing)
    if (!result.liveUrl) throw new Error('Deployment adapter did not return a live URL')
    const row = await db
      .update(deployments)
      .set({
        status: 'live',
        liveUrl: result.liveUrl,
        previewUrl: result.previewUrl ?? existing.previewUrl,
        publishedAt: new Date(),
        updatedAt: new Date(),
        failure: null,
      })
      .where(and(eq(deployments.id, id), eq(deployments.accountId, accountId)))
      .returning()
      .get()
    if (!row) throw new DeploymentError('Deployment not found', 'NOT_FOUND', 404)
    await appendLog(row, 'deployment.rollback_completed', 'Rollback completed', { liveUrl: result.liveUrl })
    return mapDeployment(row)
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : 'Rollback adapter failed'
    const row = await db
      .select()
      .from(deployments)
      .where(and(eq(deployments.id, id), eq(deployments.accountId, accountId)))
      .get()
    if (row) await appendLog(row, 'deployment.rollback_failed', 'Rollback failed', { failure: message })
    if (error instanceof DeploymentError) throw error
    throw new DeploymentError(message, 'DEPLOY_ADAPTER_FAILED', 502)
  }
}
