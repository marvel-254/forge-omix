import { useMemo, useState } from 'react'
import { BUILT_IN_TEMPLATES, type BuiltInTemplate } from '../../templates/builtIn'
import {
  defaultVariableValues,
  validateVariableSet,
  type TemplateVariableDef,
} from '../../templates/substitute'
import { instantiateTemplate } from '../../templates/instantiate'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

/**
 * Template gallery for project creation (docs/06 §6.3, §6.7).
 * Browse built-in starters or import a template file, fill in variables,
 * and create a validated project from the substituted schema.
 */
export function TemplateGallery({
  initialTemplate = null,
  onBack,
  onCreate,
}: {
  initialTemplate?: BuiltInTemplate | null
  onBack: () => void
  onCreate: (project: Record<string, unknown>) => { valid: boolean }
}) {
  const [selected, setSelected] = useState<BuiltInTemplate | null>(initialTemplate)
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    initialTemplate ? defaultVariableValues(initialTemplate.variables) : {}
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const select = (template: BuiltInTemplate) => {
    setSelected(template)
    setValues(defaultVariableValues(template.variables))
    setFieldErrors({})
    setFormError(null)
  }

  const fieldErrorsLive = useMemo(
    () => (selected ? validateVariableSet(selected.variables, values) : {}),
    [selected, values]
  )

  const handleCreate = () => {
    if (!selected) return
    if (Object.keys(fieldErrorsLive).length > 0) {
      setFieldErrors(fieldErrorsLive)
      return
    }
    const result = onCreate(instantiateTemplate(selected, values))
    if (!result.valid) {
      setFormError('The instantiated project failed schema validation.')
    }
  }

  if (!selected) {
    return (
      <div className="w-full text-left">
        <div className="mb-4 flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onBack} aria-label="Back to start">
            ←
          </Button>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Start from a template
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {BUILT_IN_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => select(template)}
              className="rounded-lg border border-neutral-200 bg-white p-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/50"
            >
              <span className="block text-sm font-medium text-neutral-900">{template.name}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                {template.description}
              </span>
              {template.variables.length > 0 && (
                <span className="mt-1 block text-xs text-neutral-400">
                  {template.variables.length} option{template.variables.length === 1 ? '' : 's'} to
                  configure
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full text-left">
      <div className="mb-4 flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => setSelected(null)} aria-label="Back to templates">
          ←
        </Button>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{selected.name}</h2>
          <p className="text-xs text-neutral-500">{selected.description}</p>
        </div>
      </div>
      {selected.variables.length === 0 ? (
        <p className="mb-4 text-sm text-neutral-500">
          No options to configure — create the project directly.
        </p>
      ) : (
        <div className="mb-4 space-y-3">
          {selected.variables.map((variable) => (
            <VariableInput
              key={variable.name}
              variable={variable}
              value={values[variable.name]}
              error={fieldErrors[variable.name]}
              onChange={(value) => {
                setValues((prev) => ({ ...prev, [variable.name]: value }))
                setFieldErrors((prev) => {
                  const next = { ...prev }
                  delete next[variable.name]
                  return next
                })
              }}
            />
          ))}
        </div>
      )}
      {formError && <p className="mb-2 text-xs text-red-600">{formError}</p>}
      <div className="flex items-center gap-2">
        <Button onClick={handleCreate}>Create project</Button>
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function VariableInput({
  variable,
  value,
  error,
  onChange,
}: {
  variable: TemplateVariableDef
  value: unknown
  error?: string
  onChange: (value: unknown) => void
}) {
  const hint = variable.description ?? variable.type
  if (variable.type === 'boolean') {
    return (
      <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-primary-500"
        />
        <span>
          {variable.name}
          <span className="ml-1 text-xs text-neutral-400">{hint}</span>
        </span>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </label>
    )
  }
  if (variable.type === 'number') {
    return (
      <div>
        <Input
          label={variable.name}
          type="number"
          value={typeof value === 'number' ? value : ''}
          placeholder={String(variable.default ?? '')}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (e.target.value !== '' && Number.isFinite(n)) onChange(n)
          }}
          error={error}
        />
        <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>
      </div>
    )
  }
  if (variable.type === 'color') {
    const text = typeof value === 'string' ? value : ''
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">{variable.name}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(text) ? text : '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-12 cursor-pointer rounded-md border border-neutral-300 bg-white p-1"
            aria-label={`${variable.name} color picker`}
          />
          <input
            value={text}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#3b82f6"
            spellCheck={false}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
  if (variable.type === 'array' || variable.type === 'object') {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">{variable.name} (JSON)</label>
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value ?? null, null, 2)}
          rows={3}
          spellCheck={false}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value))
            } catch {
              onChange(e.target.value)
            }
          }}
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
  return (
    <div>
      <Input
        label={variable.name}
        value={typeof value === 'string' ? value : ''}
        placeholder={typeof variable.default === 'string' ? variable.default : ''}
        onChange={(e) => onChange(e.target.value)}
        error={error}
      />
      <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>
    </div>
  )
}

export default TemplateGallery
