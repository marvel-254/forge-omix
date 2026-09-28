import { useCallback } from 'react'
import { useSchemaStore } from '../store/schemaStore'
import { Input } from '../components/ui/Input'

/**
 * Design tokens editor (docs/05 §5.4): edits colors, shadows, and
 * typography on the project's designTokens. Every change is validated by
 * the schema store (`setDesignTokens`) and takes effect live — Canvas
 * derives its theme CSS variables from designTokens, so the canvas
 * (components, charts, shadows) rethemes as edits land.
 */

/** Editable color roles, in display order. */
const COLOR_ROLES = [
  'primary',
  'secondary',
  'accent',
  'success',
  'warning',
  'error',
  'info',
  'background',
  'surface',
  'border',
] as const

/** Shadow token slots (level 0 "none" is implicit, not tokenized). */
const SHADOW_SLOTS = ['sm', 'md', 'lg', 'xl'] as const

type ColorRoles = (typeof COLOR_ROLES)[number]

interface TokensState {
  colors: Partial<Record<ColorRoles, string>>
  shadows: Partial<Record<(typeof SHADOW_SLOTS)[number], string>>
  /** Schema shape: fontFamily is a record; the panel edits the `sans` slot. */
  typography: { sans?: string }
}

function emptyTokens(): TokensState {
  return { colors: {}, shadows: {}, typography: {} }
}

/** Extract an editable tokens state from the project's designTokens. */
function readTokens(designTokens: unknown): TokensState {
  const state = emptyTokens()
  if (!designTokens || typeof designTokens !== 'object') return state
  const tokens = designTokens as Record<string, unknown>
  if (tokens.colors && typeof tokens.colors === 'object') {
    for (const role of COLOR_ROLES) {
      const value = (tokens.colors as Record<string, unknown>)[role]
      if (typeof value === 'string') state.colors[role] = value
    }
  }
  if (tokens.shadows && typeof tokens.shadows === 'object') {
    for (const slot of SHADOW_SLOTS) {
      const value = (tokens.shadows as Record<string, unknown>)[slot]
      if (typeof value === 'string') state.shadows[slot] = value
    }
  }
  if (tokens.typography && typeof tokens.typography === 'object') {
    const fam = (tokens.typography as Record<string, unknown>).fontFamily
    if (typeof fam === 'string') state.typography.sans = fam
    else if (fam && typeof fam === 'object') {
      const sans = (fam as Record<string, unknown>).sans
      if (typeof sans === 'string') state.typography.sans = sans
    }
  }
  return state
}

export function TokensPanel() {
  const project = useSchemaStore((s) => s.project)
  const setDesignTokens = useSchemaStore((s) => s.actions.setDesignTokens)

  const tokens = readTokens(project?.designTokens)

  const write = useCallback(
    (mutate: (draft: TokensState) => void) => {
      if (!project) return
      const draft = readTokens(project.designTokens)
      mutate(draft)
      setDesignTokens(draft as unknown as Record<string, unknown>)
    },
    [project, setDesignTokens]
  )

  if (!project) {
    return (
      <div className="flex flex-col items-center px-4 py-10 text-center">
        <p className="text-sm font-medium text-neutral-600">No project open</p>
        <p className="mt-1 text-xs text-neutral-400">Create a project to edit its design tokens.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 p-3 text-sm" data-testid="tokens-panel">
      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Colors</h4>
        {COLOR_ROLES.map((role) => {
          const value = tokens.colors[role] ?? ''
          return (
            <div key={role} className="flex items-center gap-2" data-testid={`token-color-${role}`}>
              <span
                aria-hidden
                title={value || 'Not set (default)'}
                className="h-6 w-6 shrink-0 rounded-md border border-neutral-300"
                style={{
                  background:
                    value ||
                    'repeating-linear-gradient(45deg, #e2e8f0 0 4px, #f8fafc 4px 8px)',
                }}
              />
              <Input
                label={role}
                value={value}
                placeholder="default"
                onChange={(e) =>
                  write((draft) => {
                    const v = e.target.value.trim()
                    if (v) draft.colors[role] = v
                    else delete draft.colors[role]
                  })
                }
              />
            </div>
          )
        })}
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Shadows</h4>
        {SHADOW_SLOTS.map((slot) => (
          <div key={slot} data-testid={`token-shadow-${slot}`}>
            <Input
              label={`shadow-${slot}`}
              value={tokens.shadows[slot] ?? ''}
              placeholder="default"
              onChange={(e) =>
                write((draft) => {
                  const v = e.target.value.trim()
                  if (v) draft.shadows[slot] = v
                  else delete draft.shadows[slot]
                })
              }
            />
          </div>
        ))}
        <p className="text-xs text-neutral-400">
          sm/md/lg drive card elevation levels 1–3 on the canvas.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Typography</h4>
        <Input
          label="Font family (sans)"
          value={tokens.typography.sans ?? ''}
          placeholder="system default"
          onChange={(e) =>
            write((draft) => {
              const v = e.target.value.trim()
              // Preserve any other fontFamily slots (serif/mono) untouched.
              const fam = ((project.designTokens as Record<string, unknown>)?.typography as
                | Record<string, unknown>
                | undefined)?.fontFamily
              const slots: Record<string, string> =
                fam && typeof fam === 'object' ? { ...(fam as Record<string, string>) } : {}
              if (v) slots.sans = v
              else delete slots.sans
              draft.typography = slots
            })
          }
        />
      </section>
    </div>
  )
}

export default TokensPanel
