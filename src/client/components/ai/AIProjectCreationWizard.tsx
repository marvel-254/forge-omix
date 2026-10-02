import { useEffect, useReducer, useState } from 'react'
import { aiApi } from '@client/lib/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { TextArea } from '../ui/TextArea'
import {
  aiCreationReducer,
  buildAiProjectCreationResult,
  createInitialAiCreationState,
  mapAiCreationSessionToState,
  normalizeAiCreationState,
  type AiAssetIntake,
  type AiCreationClarifications,
  type AiCreationState,
  type AiProjectCreationResult,
} from '@client/lib/aiCreation'

export interface AIProjectCreationWizardProps {
  onComplete: (result: AiProjectCreationResult) => { valid: boolean }
  onCancel: () => void
  initialState?: AiCreationState
  initialSessionId?: string
}

const STEPS = [
  { id: 'brief', label: 'Brief' },
  { id: 'clarify', label: 'Clarify' },
  { id: 'assets', label: 'Assets' },
  { id: 'review', label: 'Review' },
] as const

function AssetFields({
  legend,
  kind,
  asset,
  onChange,
}: {
  legend: string
  kind: 'logo' | 'photo'
  asset: AiAssetIntake
  onChange: (field: keyof AiAssetIntake, value: string) => void
}) {
  const prefix = `ai-${kind}`
  return (
    <fieldset className="rounded-lg border border-border p-3">
      <legend className="px-1 text-sm font-medium text-neutral-800">{legend}</legend>
      <p className="mb-3 text-xs text-muted-foreground">Optional metadata only; no file is uploaded.</p>
      <div className="space-y-3">
        <Input
          id={`${prefix}-name`}
          label="File or asset name"
          value={asset.name}
          placeholder={kind === 'logo' ? 'brand-mark.svg' : 'hero-photo.jpg'}
          onChange={(event) => onChange('name', event.target.value)}
        />
        <Input
          id={`${prefix}-url`}
          label="Source URL (optional)"
          type="url"
          value={asset.url}
          placeholder="https://…"
          onChange={(event) => onChange('url', event.target.value)}
        />
        <Input
          id={`${prefix}-alt`}
          label="Alt text"
          value={asset.altText}
          placeholder="Describe the asset"
          onChange={(event) => onChange('altText', event.target.value)}
        />
      </div>
    </fieldset>
  )
}

function ClarificationFields({
  values,
  onChange,
}: {
  values: AiCreationClarifications
  onChange: (field: keyof AiCreationClarifications, value: string) => void
}) {
  return (
    <div className="space-y-3">
      <Input
        id="ai-audience"
        label="Who is it for?"
        value={values.audience}
        placeholder="e.g. small business owners"
        onChange={(event) => onChange('audience', event.target.value)}
      />
      <Input
        id="ai-goal"
        label="What should it help people do?"
        value={values.primaryGoal}
        placeholder="e.g. book an appointment"
        onChange={(event) => onChange('primaryGoal', event.target.value)}
      />
      <Input
        id="ai-pages"
        label="Which pages or sections matter?"
        value={values.keyPages}
        placeholder="e.g. home, services, contact"
        onChange={(event) => onChange('keyPages', event.target.value)}
      />
      <Input
        id="ai-visual"
        label="What visual direction feels right?"
        value={values.visualDirection}
        placeholder="e.g. calm, editorial, high contrast"
        onChange={(event) => onChange('visualDirection', event.target.value)}
      />
    </div>
  )
}

function ReviewContent({ state }: { state: AiCreationState }) {
  const brief = normalizeAiCreationState(state)
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-3">
        <h3 className="text-sm font-semibold text-primary-900">Normalized brief</h3>
        <p className="mt-1 text-sm leading-relaxed text-primary-950">{brief.summary}</p>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-[9rem_1fr]">
        <dt className="font-medium text-muted-foreground">Project name</dt>
        <dd className="text-foreground">{brief.projectName}</dd>
        <dt className="font-medium text-muted-foreground">Audience</dt>
        <dd className="text-foreground">{brief.audience || 'Not specified'}</dd>
        <dt className="font-medium text-muted-foreground">Primary goal</dt>
        <dd className="text-foreground">{brief.primaryGoal || 'Not specified'}</dd>
        <dt className="font-medium text-muted-foreground">Pages</dt>
        <dd className="text-foreground">{brief.keyPages || 'To be decided'}</dd>
        <dt className="font-medium text-muted-foreground">Visual direction</dt>
        <dd className="text-foreground">{brief.visualDirection || 'To be decided'}</dd>
        <dt className="font-medium text-muted-foreground">Logo metadata</dt>
        <dd className="text-foreground">{brief.assets.logo?.name || brief.assets.logo?.url || 'None'}</dd>
        <dt className="font-medium text-muted-foreground">Photo metadata</dt>
        <dd className="text-foreground">{brief.assets.photo?.name || brief.assets.photo?.url || 'None'}</dd>
      </dl>
      <p className="text-xs leading-relaxed text-muted-foreground">
        The server will generate the project when you submit. If the server is unavailable, a local
        starter will be used without claiming AI generation succeeded.
      </p>
    </div>
  )
}

function creationPayload(state: AiCreationState) {
  return {
    brief: state.brief,
    projectName: state.projectName,
    clarifications: { ...state.clarifications },
    assets: {
      logo: {
        name: state.assets.logo.name,
        url: state.assets.logo.url,
        altText: state.assets.logo.altText,
      },
      photo: {
        name: state.assets.photo.name,
        url: state.assets.photo.url,
        altText: state.assets.photo.altText,
      },
    },
  }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

export function AIProjectCreationWizard({
  onComplete,
  onCancel,
  initialState,
  initialSessionId,
}: AIProjectCreationWizardProps) {
  const [state, dispatch] = useReducer(aiCreationReducer, initialState, (value) =>
    createInitialAiCreationState({
      ...value,
      sessionId: value?.sessionId ?? initialSessionId,
    })
  )
  const [resuming, setResuming] = useState(Boolean(initialSessionId))
  const [persisting, setPersisting] = useState(false)
  const stepIndex = STEPS.findIndex((step) => step.id === state.step)

  useEffect(() => {
    if (!initialSessionId) return
    let active = true
    setResuming(true)
    aiApi
      .getCreationSession(initialSessionId)
      .then(({ session }) => {
        if (active) dispatch({ type: 'sync', session })
      })
      .catch((error: unknown) => {
        if (active) {
          dispatch({ type: 'error', message: errorMessage(error, 'The creation session could not be resumed.') })
        }
      })
      .finally(() => {
        if (active) setResuming(false)
      })
    return () => {
      active = false
    }
  }, [initialSessionId])

  const persist = async (nextState: AiCreationState) => {
    setPersisting(true)
    try {
      const payload = creationPayload(nextState)
      const initialResponse = nextState.serverStatus
        ? await aiApi.updateCreationSession(nextState.sessionId, {
            step: nextState.step,
            ...payload,
          })
        : await aiApi.createCreationSession(payload)
      dispatch({ type: 'sync', session: initialResponse.session })
      const response =
        !nextState.serverStatus && initialResponse.session.step !== nextState.step
          ? await aiApi.updateCreationSession(initialResponse.session.id, {
              step: nextState.step,
              ...payload,
            })
          : initialResponse
      dispatch({ type: 'sync', session: response.session })
      return response.session
    } catch (error) {
      dispatch({
        type: 'error',
        message: errorMessage(error, 'The creation session could not be saved.'),
      })
      return null
    } finally {
      setPersisting(false)
    }
  }

  const advance = (event: 'next' | 'back') => {
    const nextState = aiCreationReducer(state, { type: event })
    dispatch({ type: event })
    if (nextState.step !== state.step) void persist(nextState)
  }

  const loadLocalFallback = (message: string) => {
    try {
      const result = buildAiProjectCreationResult(state)
      const loaded = onComplete(result)
      if (!loaded.valid) {
        dispatch({ type: 'error', message: 'The brief was not loaded as a project.' })
        return
      }
      dispatch({ type: 'fallback', message })
    } catch (error) {
      dispatch({ type: 'error', message: errorMessage(error, 'The brief could not be prepared.') })
    }
  }

  const submit = async () => {
    const submittingState = aiCreationReducer(state, { type: 'submit' })
    dispatch({ type: 'submit' })
    const saved = await persist(submittingState)
    if (!saved) {
      loadLocalFallback('AI generation was unavailable. A local starter project is ready.')
      return
    }

    try {
      const { session } = await aiApi.generateCreationSession(saved.id)
      const mapped = mapAiCreationSessionToState(session)
      if (session.status !== 'ready' || !session.generatedProject) {
        dispatch({
          type: 'error',
          message:
            session.error ??
            (session.status === 'generating'
              ? 'AI generation is still in progress. Resume this session to check it.'
              : 'The server did not return a generated project.'),
        })
        return
      }
      const result = buildAiProjectCreationResult(mapped, session.generatedProject)
      const loaded = onComplete(result)
      if (!loaded.valid) {
        dispatch({ type: 'error', message: 'The generated project was not loaded.' })
        return
      }
      dispatch({ type: 'sync', session })
      dispatch({ type: 'complete' })
    } catch (error) {
      loadLocalFallback(errorMessage(error, 'AI generation was unavailable. A local starter project is ready.'))
    }
  }

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-project-wizard-title"
      className="flex h-full min-h-0 w-full flex-col bg-card"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 id="ai-project-wizard-title" className="text-base font-semibold text-foreground">
            Create a project from a brief
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Prepare a project in a few short steps.</p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} aria-label="Close project wizard">
          ✕
        </Button>
      </div>

      <ol className="grid grid-cols-4 gap-2 border-b border-neutral-100 px-5 py-3" aria-label="Project creation progress">
        {STEPS.map((step, index) => {
          const active = step.id === state.step
          const complete = index < stepIndex || state.status === 'complete'
          return (
            <li key={step.id} className="flex min-w-0 items-center gap-1.5" aria-current={active ? 'step' : undefined}>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  complete
                    ? 'bg-emerald-100 text-emerald-800'
                    : active
                      ? 'bg-primary-500 text-white'
                      : 'bg-accent text-muted-foreground'
                }`}
                aria-hidden="true"
              >
                {complete ? '✓' : index + 1}
              </span>
              <span className={`truncate text-xs ${active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {resuming && <p className="mb-4 text-xs text-muted-foreground">Resuming creation session…</p>}

        {state.step === 'brief' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Describe what you want to build</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Use plain language. You can refine the details on the next steps.
              </p>
            </div>
            <TextArea
              id="ai-brief"
              label="Project brief"
              required
              rows={7}
              maxLength={2000}
              value={state.brief}
              error={Boolean(state.error)}
              placeholder="For example, I need a simple portfolio for a photographer…"
              onChange={(value) => dispatch({ type: 'set-brief', value })}
            />
            <Input
              id="ai-project-name"
              label="Project name (optional)"
              value={state.projectName}
              placeholder="Leave blank to infer it from the brief"
              onChange={(event) => dispatch({ type: 'set-project-name', value: event.target.value })}
            />
          </div>
        )}

        {state.step === 'clarify' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">A few details</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Short answers are enough. Leave any field blank to decide later.
              </p>
            </div>
            <ClarificationFields
              values={state.clarifications}
              onChange={(field, value) => dispatch({ type: 'set-clarification', field, value })}
            />
          </div>
        )}

        {state.step === 'assets' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Add brand assets</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Capture references now so the brief keeps the visual context. Uploads are not part of this step.
              </p>
            </div>
            <AssetFields
              legend="Logo"
              kind="logo"
              asset={state.assets.logo}
              onChange={(field, value) => dispatch({ type: 'set-asset', kind: 'logo', field, value })}
            />
            <AssetFields
              legend="Hero photo"
              kind="photo"
              asset={state.assets.photo}
              onChange={(field, value) => dispatch({ type: 'set-asset', kind: 'photo', field, value })}
            />
          </div>
        )}

        {state.step === 'review' && <ReviewContent state={state} />}

        {state.error && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {state.error}
          </p>
        )}
      </div>

      {state.status !== 'complete' && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => advance('back')}
            disabled={state.step === 'brief' || state.status === 'submitting' || persisting || resuming}
          >
            Back
          </Button>
          {state.step === 'review' ? (
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={state.status === 'submitting' || persisting || resuming}
            >
              {state.status === 'submitting' ? 'Generating…' : 'Create project'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => advance('next')}
              disabled={state.status === 'submitting' || persisting || resuming}
            >
              Continue
            </Button>
          )}
        </div>
      )}

      {state.status === 'complete' && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p role="status" className="text-sm text-emerald-700">
            {state.error ? 'Local starter project ready.' : 'Generated project ready.'}
          </p>
          <Button type="button" size="sm" onClick={onCancel}>Close</Button>
        </div>
      )}
    </section>
  )
}

export default AIProjectCreationWizard
