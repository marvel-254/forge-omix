import { z } from 'zod'

export const DeploymentEnvironmentSchema = z.enum(['preview', 'staging', 'production'])
export const DeploymentStatusSchema = z.enum([
  'queued',
  'building',
  'ready',
  'deploying',
  'live',
  'failed',
])

export const deploymentCreateSchema = z.object({
  projectId: z.string().trim().min(1).max(200),
  environment: DeploymentEnvironmentSchema,
  version: z.string().trim().min(1).max(200).optional(),
})

export const deploymentListQuerySchema = z.object({
  projectId: z.string().trim().min(1).max(200),
})

export const DeploymentSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  projectId: z.string(),
  environment: DeploymentEnvironmentSchema,
  version: z.string().nullable(),
  status: DeploymentStatusSchema,
  failure: z.string().nullable(),
  previewUrl: z.string().nullable(),
  liveUrl: z.string().nullable(),
  commitHash: z.string().nullable(),
  commitMessage: z.string().nullable(),
  commitAuthor: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const DeploymentLogSchema = z.object({
  id: z.string(),
  deploymentId: z.string(),
  accountId: z.string(),
  event: z.string(),
  message: z.string(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
})

export type DeploymentEnvironment = z.infer<typeof DeploymentEnvironmentSchema>
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>
export type DeploymentCreateInput = z.infer<typeof deploymentCreateSchema>
export type Deployment = z.infer<typeof DeploymentSchema>
export type DeploymentLog = z.infer<typeof DeploymentLogSchema>
