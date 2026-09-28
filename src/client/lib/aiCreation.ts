import { getBuiltInTemplate } from '@client/templates/builtIn'
import { instantiateTemplate } from '@client/templates/instantiate'
import { ProjectSchema, validate } from '@server/validation'
import type { Project } from '@client/types/schema'
import type {
  AiCreationSession,
  AiCreationSessionStatus,
} from '@client/lib/api'

export type AiCreationStep = 'brief' | 'clarify' | 'assets' | 'review'
export type AiCreationStatus = 'editing' | 'submitting' | 'complete' | 'error'

export interface AiCreationClarifications {
  audience: string
  primaryGoal: string
  keyPages: string
  visualDirection: string
}

export interface AiAssetIntake {
  name: string
  url: string
  altText: string
}

export interface AiCreationState {
  step: AiCreationStep
  status: AiCreationStatus
  sessionId: string
  brief: string
  projectName: string
  clarifications: AiCreationClarifications
  assets: {
    logo: AiAssetIntake
    photo: AiAssetIntake
  }
  serverStatus: AiCreationSessionStatus | null
  generatedProject: Record<string, unknown> | null
  error: string | null
}

export type AiCreationEvent =
  | { type: 'set-brief'; value: string }
  | { type: 'set-project-name'; value: string }
  | { type: 'set-clarification'; field: keyof AiCreationClarifications; value: string }
  | { type: 'set-asset'; kind: 'logo' | 'photo'; field: keyof AiAssetIntake; value: string }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'submit' }
  | { type: 'complete' }
  | { type: 'fallback'; message: string }
  | { type: 'sync'; session: AiCreationSession }
  | { type: 'error'; message: string }
  | { type: 'reset' }

export interface NormalizedAiProjectBrief {
  projectName: string
  summary: string
  audience: string
  primaryGoal: string
  keyPages: string
  visualDirection: string
  assets: {
    logo: AiAssetIntake | null
    photo: AiAssetIntake | null
  }
}

export interface AiProjectCreationResult {
  sessionId: string
  rawBrief: string
  normalizedBrief: NormalizedAiProjectBrief
  project: Project
}

const EMPTY_CLARIFICATIONS: AiCreationClarifications = {
  audience: '',
  primaryGoal: '',
  keyPages: '',
  visualDirection: '',
}

const EMPTY_ASSETS: AiCreationState['assets'] = {
  logo: { name: '', url: '', altText: '' },
  photo: { name: '', url: '', altText: '' },
}

function createId(prefix: string): string {
  return `${prefix}_` + Math.random().toString(36).slice(2, 10)
}

function compact(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function projectNameFromBrief(brief: string): string {
  const firstThought = compact(brief).split(/[.!?;,]/)[0] ?? ''
  return firstThought.slice(0, 100).trim() || 'New Project'
}

function emptyAsset(asset: AiAssetIntake): AiAssetIntake | null {
  return asset.name.trim() || asset.url.trim() || asset.altText.trim() ? { ...asset } : null
}

export function createInitialAiCreationState(
  initial: Partial<Omit<AiCreationState, 'clarifications' | 'assets'>> & {
    clarifications?: Partial<AiCreationClarifications>
    assets?: Partial<AiCreationState['assets']>
  } = {}
): AiCreationState {
  return {
    step: initial.step ?? 'brief',
    status: initial.status ?? 'editing',
    sessionId: initial.sessionId ?? createId('ai'),
    brief: initial.brief ?? '',
    projectName: initial.projectName ?? '',
    clarifications: { ...EMPTY_CLARIFICATIONS, ...initial.clarifications },
    assets: {
      logo: { ...EMPTY_ASSETS.logo, ...initial.assets?.logo },
      photo: { ...EMPTY_ASSETS.photo, ...initial.assets?.photo },
    },
    serverStatus: initial.serverStatus ?? null,
    generatedProject: initial.generatedProject ?? null,
    error: initial.error ?? null,
  }
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function clarificationValue(clarifications: Record<string, string>, field: keyof AiCreationClarifications): string {
  return stringValue(clarifications[field])
}

function assetValue(
  asset: { name?: string; url?: string; altText?: string } | null | undefined
): AiAssetIntake {
  return {
    name: stringValue(asset?.name),
    url: stringValue(asset?.url),
    altText: stringValue(asset?.altText),
  }
}

export function mapAiCreationSessionToState(session: AiCreationSession): AiCreationState {
  const status: AiCreationStatus =
    session.status === 'ready'
      ? 'complete'
      : session.status === 'generating'
        ? 'submitting'
        : session.status === 'failed'
          ? 'error'
          : 'editing'

  return createInitialAiCreationState({
    sessionId: session.id,
    step: session.step as AiCreationStep,
    status,
    brief: session.brief,
    projectName: session.projectName,
    clarifications: {
      audience: clarificationValue(session.clarifications, 'audience'),
      primaryGoal: clarificationValue(session.clarifications, 'primaryGoal'),
      keyPages: clarificationValue(session.clarifications, 'keyPages'),
      visualDirection: clarificationValue(session.clarifications, 'visualDirection'),
    },
    assets: {
      logo: assetValue(session.assets.logo),
      photo: assetValue(session.assets.photo),
    },
    serverStatus: session.status,
    generatedProject: session.generatedProject,
    error: session.error,
  })
}

export function aiCreationReducer(state: AiCreationState, event: AiCreationEvent): AiCreationState {
  switch (event.type) {
    case 'set-brief':
      return { ...state, brief: event.value, error: null }
    case 'set-project-name':
      return { ...state, projectName: event.value, error: null }
    case 'set-clarification':
      return {
        ...state,
        clarifications: { ...state.clarifications, [event.field]: event.value },
        error: null,
      }
    case 'set-asset':
      return {
        ...state,
        assets: {
          ...state.assets,
          [event.kind]: { ...state.assets[event.kind], [event.field]: event.value },
        },
        error: null,
      }
    case 'next': {
      if (!['editing', 'error'].includes(state.status)) return state
      if (state.step === 'brief' && !compact(state.brief)) {
        return { ...state, status: 'error', error: 'Tell us what you want to build first.' }
      }
      if (state.step === 'brief') return { ...state, step: 'clarify', error: null }
      if (state.step === 'clarify') return { ...state, step: 'assets', error: null }
      if (state.step === 'assets') return { ...state, step: 'review', error: null }
      return state
    }
    case 'back': {
      if (!['editing', 'error'].includes(state.status)) return state
      if (state.step === 'clarify') return { ...state, step: 'brief', error: null }
      if (state.step === 'assets') return { ...state, step: 'clarify', error: null }
      if (state.step === 'review') return { ...state, step: 'assets', error: null }
      return state
    }
    case 'submit':
      if (state.step !== 'review' || !['editing', 'error'].includes(state.status)) return state
      return { ...state, status: 'submitting', error: null }
    case 'complete':
      return state.status === 'submitting' ? { ...state, status: 'complete' } : state
    case 'fallback':
      return { ...state, status: 'complete', error: event.message }
    case 'sync':
      return mapAiCreationSessionToState(event.session)
    case 'error':
      return { ...state, status: 'error', error: event.message }
    case 'reset':
      return createInitialAiCreationState({ sessionId: state.sessionId })
  }
}

export function normalizeAiCreationState(state: AiCreationState): NormalizedAiProjectBrief {
  const brief = compact(state.brief)
  const audience = compact(state.clarifications.audience)
  const primaryGoal = compact(state.clarifications.primaryGoal)
  const keyPages = compact(state.clarifications.keyPages)
  const visualDirection = compact(state.clarifications.visualDirection)
  const projectName = compact(state.projectName) || projectNameFromBrief(brief)
  const summaryParts = [
    `Create ${projectName}`,
    audience ? `for ${audience}` : 'for its intended audience',
    primaryGoal ? `that ${primaryGoal}` : 'with a clear primary goal',
    keyPages ? `including ${keyPages}` : 'with the pages it needs',
    visualDirection ? `in a ${visualDirection} visual direction` : '',
  ]

  return {
    projectName,
    summary: compact(summaryParts.filter(Boolean).join(' ')),
    audience,
    primaryGoal,
    keyPages,
    visualDirection,
    assets: {
      logo: emptyAsset(state.assets.logo),
      photo: emptyAsset(state.assets.photo),
    },
  }
}

export function buildAiProjectCreationResult(
  state: AiCreationState,
  serverProject?: Record<string, unknown> | null
): AiProjectCreationResult {
  const normalizedBrief = normalizeAiCreationState(state)
  const project = instantiateTemplate(getBuiltInTemplate('tmpl_blank')!)
  const candidate = serverProject ?? {
    ...project,
    name: normalizedBrief.projectName,
    description: normalizedBrief.summary.slice(0, 1000),
  }
  const validated = validate(ProjectSchema, candidate)
  if (!validated.valid || !validated.data) {
    throw new Error('The normalized brief could not be converted into a valid project starter.')
  }

  return {
    sessionId: state.sessionId,
    rawBrief: compact(state.brief),
    normalizedBrief,
    project: validated.data as Project,
  }
}
