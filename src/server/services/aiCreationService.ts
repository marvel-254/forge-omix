import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import { aiCreationSessions } from '../db/schema'
import {
  AiCreationSessionSchema,
  type AiCreationAssets,
  type AiCreationClarifications,
  type AiCreationSession,
  type AiCreationSessionInput,
  type AiCreationSessionUpdate,
  type AiCreationStep,
} from '../validation/aiCreation'
import { ProjectSchema } from '../validation'

export interface NormalizedAiCreationBrief {
  projectName: string
  summary: string
  audience: string
  primaryGoal: string
  keyPages: string
  visualDirection: string
  assets: AiCreationAssets
}

export type AiCreationProjectGenerator = (
  brief: NormalizedAiCreationBrief
) => Promise<Record<string, unknown>>

export class AiCreationConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiCreationConflictError'
  }
}

export class AiCreationGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiCreationGenerationError'
  }
}

function compact(value: string | undefined): string {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

function projectNameFromBrief(brief: string): string {
  const firstThought = compact(brief).split(/[.!?;,]/)[0] ?? ''
  return firstThought.slice(0, 100).trim() || 'New Project'
}

function normalizeBrief(
  brief: string,
  projectName: string,
  clarifications: AiCreationClarifications,
  assets: AiCreationAssets
): NormalizedAiCreationBrief {
  const normalizedProjectName = compact(projectName) || projectNameFromBrief(brief)
  const audience = compact(clarifications.audience)
  const primaryGoal = compact(clarifications.primaryGoal)
  const keyPages = compact(clarifications.keyPages)
  const visualDirection = compact(clarifications.visualDirection)
  const summaryParts = [
    `Create ${normalizedProjectName}`,
    audience ? `for ${audience}` : 'for its intended audience',
    primaryGoal ? `that ${primaryGoal}` : 'with a clear primary goal',
    keyPages ? `including ${keyPages}` : 'with the pages it needs',
    visualDirection ? `in a ${visualDirection} visual direction` : '',
  ]

  return {
    projectName: normalizedProjectName,
    summary: compact(summaryParts.filter(Boolean).join(' ')),
    audience,
    primaryGoal,
    keyPages,
    visualDirection,
    assets,
  }
}

export function createDeterministicStarterProject(brief: NormalizedAiCreationBrief): Record<string, unknown> {
  const projectId = `proj_${crypto.randomUUID().replace(/-/g, '')}`
  const candidate = {
    id: projectId,
    name: brief.projectName,
    description: brief.summary.slice(0, 1000),
    version: '1.0.0',
    pages: [
      {
        id: 'page_home',
        path: '/',
        title: 'Home',
        components: [
          {
            id: 'comp_hero',
            type: 'Hero',
            props: {
              heading: brief.projectName,
              description: brief.summary,
            },
          },
        ],
      },
    ],
    components: [],
    designTokens: {
      colors: {
        primary: '#2563eb',
        background: '#ffffff',
        text: { primary: '#111827' },
      },
    },
    generation: {
      implementation: 'deterministic_starter',
      fullModelGeneration: false,
      providerHook: 'next-slice',
    },
  }
  const validated = ProjectSchema.safeParse(candidate)
  if (!validated.success) {
    throw new Error('The normalized brief could not be converted into a valid project starter')
  }
  return validated.data as Record<string, unknown>
}

let projectGenerator: AiCreationProjectGenerator = async (brief) =>
  createDeterministicStarterProject(brief)

export function setAiCreationProjectGenerator(generator: AiCreationProjectGenerator | null): void {
  projectGenerator = generator ?? (async (brief) => createDeterministicStarterProject(brief))
}

function toIso(value: Date): string {
  return value.toISOString()
}

function mapSession(row: typeof aiCreationSessions.$inferSelect): AiCreationSession {
  return AiCreationSessionSchema.parse({
    id: row.id,
    status: row.status,
    step: row.step,
    brief: row.brief,
    projectName: row.projectName,
    clarifications: row.clarifications as AiCreationClarifications,
    assets: row.assets as AiCreationAssets,
    generatedProject: (row.generatedProject as Record<string, unknown> | null) ?? null,
    error: row.error,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  })
}

export async function createAiCreationSession(accountId: string, input: AiCreationSessionInput) {
  const now = new Date()
  const projectName = compact(input.projectName) || projectNameFromBrief(input.brief)
  const row = await db
    .insert(aiCreationSessions)
    .values({
      id: crypto.randomUUID(),
      accountId,
      status: 'draft',
      step: 'brief',
      brief: input.brief,
      projectName,
      clarifications: input.clarifications ?? {},
      assets: input.assets ?? {},
      generatedProject: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get()
  return mapSession(row)
}

export async function getAiCreationSession(accountId: string, id: string) {
  const row = await db
    .select()
    .from(aiCreationSessions)
    .where(and(eq(aiCreationSessions.id, id), eq(aiCreationSessions.accountId, accountId)))
    .get()
  return row ? mapSession(row) : null
}

export async function updateAiCreationSession(
  accountId: string,
  id: string,
  input: AiCreationSessionUpdate
) {
  const existing = await getAiCreationSession(accountId, id)
  if (!existing) return null

  const nextStep: AiCreationStep = input.step ?? existing.step
  const nextBrief = input.brief ?? existing.brief
  const nextProjectName = input.projectName ?? existing.projectName
  const nextClarifications = input.clarifications ?? existing.clarifications
  const nextAssets = input.assets ?? existing.assets
  const row = await db
    .update(aiCreationSessions)
    .set({
      step: nextStep,
      brief: nextBrief,
      projectName: compact(nextProjectName) || projectNameFromBrief(nextBrief),
      clarifications: nextClarifications,
      assets: nextAssets,
      status: 'draft',
      generatedProject: null,
      error: null,
      updatedAt: new Date(),
    })
    .where(and(eq(aiCreationSessions.id, id), eq(aiCreationSessions.accountId, accountId)))
    .returning()
    .get()
  return row ? mapSession(row) : null
}

export async function generateAiCreationSession(accountId: string, id: string) {
  const existing = await getAiCreationSession(accountId, id)
  if (!existing) return null
  if (existing.status === 'generating') {
    throw new AiCreationConflictError('Project generation is already in progress')
  }
  if (existing.status === 'ready' && existing.generatedProject) {
    throw new AiCreationConflictError('This creation session already has a generated project')
  }

  const claimed = await db
    .update(aiCreationSessions)
    .set({ status: 'generating', error: null, updatedAt: new Date() })
    .where(
      and(
        eq(aiCreationSessions.id, id),
        eq(aiCreationSessions.accountId, accountId),
        inArray(aiCreationSessions.status, ['draft', 'failed'])
      )
    )
    .returning()
    .get()
  if (!claimed) {
    throw new AiCreationConflictError('This creation session is not available for generation')
  }

  try {
    const normalizedBrief = normalizeBrief(
      claimed.brief,
      claimed.projectName,
      claimed.clarifications as AiCreationClarifications,
      claimed.assets as AiCreationAssets
    )
    const generatedProject = await projectGenerator(normalizedBrief)
    const parsedProject = ProjectSchema.safeParse(generatedProject)
    if (!parsedProject.success) {
      throw new Error('The project generator returned an invalid project schema')
    }
    const completed = await db
      .update(aiCreationSessions)
      .set({
        status: 'ready',
        generatedProject: parsedProject.data as Record<string, unknown>,
        error: null,
        updatedAt: new Date(),
      })
      .where(and(eq(aiCreationSessions.id, id), eq(aiCreationSessions.accountId, accountId)))
      .returning()
      .get()
    return completed ? mapSession(completed) : null
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : 'Project generation failed'
    await db
      .update(aiCreationSessions)
      .set({ status: 'failed', error: message, updatedAt: new Date() })
      .where(and(eq(aiCreationSessions.id, id), eq(aiCreationSessions.accountId, accountId)))
    throw new AiCreationGenerationError(message)
  }
}
