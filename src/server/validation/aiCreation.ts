import { z } from 'zod'

export const AiCreationStatusSchema = z.enum(['draft', 'generating', 'ready', 'failed'])
export const AiCreationStepSchema = z.enum(['brief', 'clarify', 'assets', 'review'])

export const AiCreationAssetSchema = z
  .object({
    name: z.string().max(500).optional(),
    url: z.string().max(2000).optional(),
    altText: z.string().max(500).optional(),
  })
  .strict()

export const AiCreationAssetsSchema = z
  .object({
    logo: AiCreationAssetSchema.nullable().optional(),
    photo: AiCreationAssetSchema.nullable().optional(),
  })
  .strict()

export const AiCreationClarificationsSchema = z.record(z.string().max(2000))

export const aiCreationSessionCreateSchema = z
  .object({
    brief: z.string().trim().min(1).max(10000),
    projectName: z.string().trim().min(1).max(100).optional(),
    clarifications: AiCreationClarificationsSchema.optional(),
    assets: AiCreationAssetsSchema.optional(),
  })
  .strict()

export const aiCreationSessionUpdateSchema = z
  .object({
    step: AiCreationStepSchema.optional(),
    brief: z.string().trim().min(1).max(10000).optional(),
    projectName: z.string().trim().min(1).max(100).optional(),
    clarifications: AiCreationClarificationsSchema.optional(),
    assets: AiCreationAssetsSchema.optional(),
  })
  .strict()

export const AiCreationSessionSchema = z
  .object({
    id: z.string(),
    status: AiCreationStatusSchema,
    step: AiCreationStepSchema,
    brief: z.string(),
    projectName: z.string(),
    clarifications: AiCreationClarificationsSchema,
    assets: AiCreationAssetsSchema,
    generatedProject: z.record(z.unknown()).nullable(),
    error: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict()

export type AiCreationStatus = z.infer<typeof AiCreationStatusSchema>
export type AiCreationStep = z.infer<typeof AiCreationStepSchema>
export type AiCreationAsset = z.infer<typeof AiCreationAssetSchema>
export type AiCreationAssets = z.infer<typeof AiCreationAssetsSchema>
export type AiCreationClarifications = z.infer<typeof AiCreationClarificationsSchema>
export type AiCreationSession = z.infer<typeof AiCreationSessionSchema>
export type AiCreationSessionInput = z.infer<typeof aiCreationSessionCreateSchema>
export type AiCreationSessionUpdate = z.infer<typeof aiCreationSessionUpdateSchema>
