import { describe, expect, it } from 'vitest'
import {
  aiCreationReducer,
  buildAiProjectCreationResult,
  createInitialAiCreationState,
  mapAiCreationSessionToState,
  normalizeAiCreationState,
} from '@client/lib/aiCreation'
import { ProjectSchema } from '@server/validation'

describe('AI project creation state machine', () => {
  it('blocks an empty brief and advances through explicit resumable steps', () => {
    const initial = createInitialAiCreationState({ sessionId: 'ai_test' })
    const blocked = aiCreationReducer(initial, { type: 'next' })
    expect(blocked.status).toBe('error')
    expect(blocked.step).toBe('brief')

    let state = aiCreationReducer(
      { ...blocked, status: 'editing', brief: 'A calm portfolio for a photographer' },
      { type: 'next' }
    )
    state = aiCreationReducer(state, { type: 'next' })
    state = aiCreationReducer(state, { type: 'next' })
    expect(state.step).toBe('review')

    state = aiCreationReducer(state, { type: 'back' })
    state = aiCreationReducer(state, { type: 'back' })
    state = aiCreationReducer(state, { type: 'back' })
    expect(state.step).toBe('brief')
    expect(state.brief).toBe('A calm portfolio for a photographer')

    state = aiCreationReducer(state, { type: 'reset' })
    expect(state.sessionId).toBe('ai_test')
    expect(state.brief).toBe('')
  })

  it('keeps clarification and asset metadata in the resumable state', () => {
    const initial = createInitialAiCreationState({ sessionId: 'ai_test', brief: 'A booking site' })
    const withAudience = aiCreationReducer(initial, {
      type: 'set-clarification',
      field: 'audience',
      value: 'independent therapists',
    })
    const withAsset = aiCreationReducer(withAudience, {
      type: 'set-asset',
      kind: 'logo',
      field: 'name',
      value: 'logo.svg',
    })
    const normalized = normalizeAiCreationState(withAsset)

    expect(withAsset.clarifications.audience).toBe('independent therapists')
    expect(normalized.assets.logo).toEqual({ name: 'logo.svg', url: '', altText: '' })
    expect(normalized.summary).toContain('independent therapists')
  })
  it('maps a server session into resumable state and its generated project', () => {
    const state = mapAiCreationSessionToState({
      id: 'ai_server',
      status: 'ready',
      step: 'review',
      brief: 'A booking site',
      projectName: 'Bookings',
      clarifications: { audience: 'therapists', primaryGoal: 'book online' },
      assets: { logo: { name: 'logo.svg' }, photo: null },
      generatedProject: { name: 'Server project' },
      error: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })

    expect(state.sessionId).toBe('ai_server')
    expect(state.status).toBe('complete')
    expect(state.serverStatus).toBe('ready')
    expect(state.clarifications.audience).toBe('therapists')
    expect(state.assets.logo.name).toBe('logo.svg')
    expect(state.generatedProject).toEqual({ name: 'Server project' })
  })
})

describe('buildAiProjectCreationResult', () => {
  it('emits a typed normalized brief and a schema-valid starter project', () => {
    const state = {
      ...createInitialAiCreationState({ sessionId: 'ai_test', brief: 'Build a booking site.' }),
      step: 'review' as const,
      projectName: 'Calm Booking',
      clarifications: {
        audience: 'therapists',
        primaryGoal: 'accept bookings',
        keyPages: 'home and availability',
        visualDirection: 'calm and editorial',
      },
    }

    const result = buildAiProjectCreationResult(state)
    expect(result.sessionId).toBe('ai_test')
    expect(result.normalizedBrief.projectName).toBe('Calm Booking')
    expect(result.normalizedBrief.summary).toContain('accept bookings')
    expect(result.project.name).toBe('Calm Booking')
    expect(result.project.description).toContain('Calm Booking')
    expect(ProjectSchema.safeParse(result.project).success).toBe(true)
  })
})
