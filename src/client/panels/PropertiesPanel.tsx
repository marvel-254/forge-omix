import { useCallback, useEffect, useState } from 'react'
import { useSchemaStore } from '../store/schemaStore'
import { resolveActivePage } from '../canvas/puckBridge'
import { canvasRegistry } from '../canvas/registry'
import type { Component } from '@client/types/schema'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

/**
 * Context-sensitive panel for the selected component (docs/04 §4.8,
 * docs/05 §5.2). Edits props, base styles, interactions, responsive
 * overrides, and accessibility metadata on the active page's component
 * tree; every mutation is validated by the schema store before commit.
 *
 * Prop editors are generated from the Puck field definitions in
 * `canvasRegistry` so the panel and the canvas field panel never disagree
 * about a component's editable props. Array/object props (links, columns,
 * datasets) are edited as JSON; everything else gets a typed control.
 */

const BREAKPOINTS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const

const INTERACTION_TYPES = ['navigate', 'apiCall', 'stateUpdate', 'emit', 'custom'] as const

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

interface FieldDef {
  type?: string
  label?: string
  options?: Array<{ label: string; value: unknown }>
  min?: number
  max?: number
  step?: number
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h4>
      {children}
    </div>
  )
}

function FieldJson({
  label,
  value,
  onCommit,
}: {
  label: string
  value: unknown
  onCommit: (value: unknown) => void
}) {
  const committed = JSON.stringify(value ?? null, null, 2)
  const [text, setText] = useState(committed)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    setText(committed)
    setError(null)
    // Resync when switching component/field; intentionally not on every
    // external edit so in-progress typing is never clobbered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label])
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-neutral-600">{label} (JSON)</label>
      <textarea
        value={text}
        rows={Math.min(8, Math.max(3, text.split('\n').length))}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value)
          try {
            onCommit(JSON.parse(e.target.value))
            setError(null)
          } catch {
            setError('Invalid JSON — not saved')
          }
        }}
        className={`w-full rounded-md border bg-white px-2 py-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          error ? 'border-red-400' : 'border-neutral-300'
        }`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function KeyValueRows({
  values,
  onChange,
  keyPlaceholder = 'property',
  valuePlaceholder = 'value',
}: {
  values: Record<string, string | number>
  onChange: (next: Record<string, string | number>) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}) {
  const entries = Object.entries(values)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  return (
    <div className="space-y-1.5">
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-center gap-1">
          <input
            value={key}
            aria-label="Property name"
            onChange={(e) => {
              const nextKey = e.target.value.trim()
              if (!nextKey || nextKey === key) return
              const next = { ...values }
              delete next[key]
              next[nextKey] = val
              onChange(next)
            }}
            className="w-1/2 rounded-md border border-neutral-300 bg-white px-2 py-1 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input
            value={String(val)}
            aria-label={`Value for ${key}`}
            onChange={(e) => onChange({ ...values, [key]: e.target.value })}
            className="w-1/2 rounded-md border border-neutral-300 bg-white px-2 py-1 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Remove ${key}`}
            onClick={() => {
              const next = { ...values }
              delete next[key]
              onChange(next)
            }}
          >
            ✕
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-1">
        <input
          value={newKey}
          placeholder={keyPlaceholder}
          aria-label="New property name"
          onChange={(e) => setNewKey(e.target.value)}
          className="w-1/2 rounded-md border border-dashed border-neutral-300 bg-white px-2 py-1 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          value={newValue}
          placeholder={valuePlaceholder}
          aria-label="New property value"
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newKey.trim()) {
              onChange({ ...values, [newKey.trim()]: newValue })
              setNewKey('')
              setNewValue('')
            }
          }}
          className="w-1/2 rounded-md border border-dashed border-neutral-300 bg-white px-2 py-1 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          variant="ghost"
          size="sm"
          aria-label="Add property"
          disabled={!newKey.trim()}
          onClick={() => {
            onChange({ ...values, [newKey.trim()]: newValue })
            setNewKey('')
            setNewValue('')
          }}
        >
          +
        </Button>
      </div>
    </div>
  )
}

export function PropertiesPanel() {
  const project = useSchemaStore((s) => s.project)
  const activePageId = useSchemaStore((s) => s.activePageId)
  const selectedIds = useSchemaStore((s) => s.selectedIds)
  const updateProject = useSchemaStore((s) => s.actions.updateProject)
  const removeComponentFromPage = useSchemaStore((s) => s.actions.removeComponentFromPage)

  const page = resolveActivePage(project, activePageId)
  const selectedId = selectedIds.values().next().value as string | undefined
  const component =
    selectedId && page
      ? page.components.find((c: Component) => c.id === selectedId)
      : undefined

  const patchComponent = useCallback(
    (componentId: string, patch: Partial<Component>) => {
      if (!project || !page) return
      const updated = {
        ...project,
        pages: project.pages.map((p) =>
          p.id === page.id
            ? {
                ...p,
                components: p.components.map((c) =>
                  c.id === componentId ? { ...c, ...patch } : c
                ),
              }
            : p
        ),
        updatedAt: new Date().toISOString(),
      }
      updateProject(updated as unknown as Record<string, unknown>)
    },
    [project, page, updateProject]
  )

  if (!component) {
    return (
      <div className="flex flex-col items-center px-4 py-10 text-center">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-base text-neutral-400">
          ◈
        </div>
        <p className="text-sm font-medium text-neutral-600">No component selected</p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-400">
          Select a component on the canvas to edit its properties.
        </p>
      </div>
    )
  }

  const comp = component as unknown as Record<string, unknown>
  const props = (comp.props ?? {}) as Record<string, unknown>
  const setProps = (patch: Record<string, unknown>) =>
    patchComponent(component.id, { props: { ...props, ...patch } } as Partial<Component>)

  const styles = (comp.styles ?? {}) as Record<string, unknown>
  const baseStyles = (styles.base ?? {}) as Record<string, string | number>
  const setBaseStyles = (base: Record<string, string | number>) =>
    patchComponent(component.id, { styles: { ...styles, base } } as Partial<Component>)

  const interactions = (comp.interactions ?? {}) as Record<string, unknown>
  const setInteraction = (event: string, handler: Record<string, unknown> | undefined) => {
    const next = { ...interactions }
    if (handler === undefined) delete next[event]
    else next[event] = handler
    patchComponent(component.id, { interactions: next } as Partial<Component>)
  }

  const responsive = (comp.responsive ?? []) as Array<Record<string, unknown>>
  const setResponsive = (next: Array<Record<string, unknown>>) =>
    patchComponent(component.id, { responsive: next } as Partial<Component>)

  const a11y = (comp.accessibility ?? {}) as Record<string, unknown>
  const setA11y = (patch: Record<string, unknown>) =>
    patchComponent(component.id, {
      accessibility: { ...a11y, ...patch },
    } as Partial<Component>)

  const fields = ((canvasRegistry[component.type] as unknown as { fields?: Record<string, FieldDef> })
    ?.fields ?? {}) as Record<string, FieldDef>

  return (
    <div className="space-y-4 p-3 text-sm">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="inline-block rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
            {component.type}
          </span>
          <span className="max-w-[120px] truncate text-xs text-neutral-400">{component.id}</span>
        </div>
        <Input
          label="Name"
          value={component.name ?? ''}
          placeholder={component.type}
          onChange={(e) => patchComponent(component.id, { name: e.target.value })}
        />
      </div>

      <Section title="Props">
        {Object.entries(fields).map(([fieldName, def]) => {
          const label = def.label ?? fieldName
          const current = props[fieldName]
          if (def.type === 'select' && def.options) {
            const match = def.options.find((o) => String(o.value) === String(current ?? ''))
            return (
              <div key={fieldName} className="space-y-1">
                <label className="block text-xs font-medium text-neutral-600">{label}</label>
                <select
                  value={match ? String(match.value) : ''}
                  onChange={(e) => {
                    const opt = def.options?.find((o) => String(o.value) === e.target.value)
                    if (opt) setProps({ [fieldName]: opt.value })
                  }}
                  className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {def.options.map((o) => (
                    <option key={String(o.value)} value={String(o.value)}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )
          }
          if (def.type === 'number') {
            return (
              <Input
                key={fieldName}
                label={label}
                type="number"
                min={def.min}
                max={def.max}
                step={def.step}
                value={typeof current === 'number' ? current : ''}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (Number.isFinite(n)) setProps({ [fieldName]: n })
                }}
              />
            )
          }
          if (def.type === 'textarea') {
            return (
              <div key={fieldName} className="space-y-1">
                <label className="block text-xs font-medium text-neutral-600">{label}</label>
                <textarea
                  value={typeof current === 'string' ? current : ''}
                  rows={3}
                  onChange={(e) => setProps({ [fieldName]: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )
          }
          if (def.type === 'text' || def.type === undefined) {
            return (
              <Input
                key={fieldName}
                label={label}
                value={typeof current === 'string' ? current : ''}
                onChange={(e) => setProps({ [fieldName]: e.target.value })}
              />
            )
          }
          return (
            <FieldJson
              key={`${component.id}:${fieldName}`}
              label={label}
              value={current}
              onCommit={(v) => setProps({ [fieldName]: v })}
            />
          )
        })}
      </Section>

      <Section title="Styles">
        <KeyValueRows values={baseStyles} onChange={setBaseStyles} />
        <p className="text-xs text-neutral-400">
          Base styles apply on canvas; values may use {'$ref'} token pointers.
        </p>
      </Section>

      <Section title="Interactions">
        {(['onClick', 'onSubmit'] as const).map((event) => {
          const handler = interactions[event] as Record<string, unknown> | undefined
          if (!handler) {
            return (
              <Button
                key={event}
                variant="outline"
                size="sm"
                onClick={() => setInteraction(event, { type: 'navigate', target: '/' })}
              >
                + Add {event}
              </Button>
            )
          }
          return (
            <div key={event} className="space-y-1.5 rounded-md border border-neutral-200 p-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-neutral-700">{event}</span>
                <Button variant="ghost" size="sm" aria-label={`Remove ${event}`} onClick={() => setInteraction(event, undefined)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-600">Action</label>
                <select
                  value={typeof handler.type === 'string' ? handler.type : 'navigate'}
                  onChange={(e) =>
                    setInteraction(event, { ...handler, type: e.target.value })
                  }
                  className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {INTERACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Target"
                value={typeof handler.target === 'string' ? handler.target : ''}
                placeholder="/dashboard or https://…"
                onChange={(e) => setInteraction(event, { ...handler, target: e.target.value })}
              />
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-600">Method</label>
                <select
                  value={typeof handler.method === 'string' ? handler.method : 'GET'}
                  onChange={(e) =>
                    setInteraction(event, { ...handler, method: e.target.value })
                  }
                  className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {HTTP_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
      </Section>

      <Section title="Responsive">
        {responsive.length === 0 && (
          <p className="text-xs text-neutral-400">No overrides. Components render the same at every viewport.</p>
        )}
        {responsive.map((entry, index) => (
          <div key={`${String(entry.breakpoint)}:${index}`} className="space-y-1.5 rounded-md border border-neutral-200 p-2">
            <div className="flex items-center gap-2">
              <select
                value={typeof entry.breakpoint === 'string' ? entry.breakpoint : 'md'}
                aria-label="Breakpoint"
                onChange={(e) => {
                  const next = [...responsive]
                  next[index] = { ...entry, breakpoint: e.target.value }
                  setResponsive(next)
                }}
                className="flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {BREAKPOINTS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={entry.hidden === true}
                  onChange={(e) => {
                    const next = [...responsive]
                    next[index] = { ...entry, hidden: e.target.checked }
                    setResponsive(next)
                  }}
                />
                Hide
              </label>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove override"
                onClick={() => setResponsive(responsive.filter((_, i) => i !== index))}
              >
                ✕
              </Button>
            </div>
            <KeyValueRows
              values={((entry.props ?? {}) as Record<string, unknown>) as Record<string, string | number>}
              onChange={(propsPatch) => {
                const next = [...responsive]
                next[index] = { ...entry, props: propsPatch }
                setResponsive(next)
              }}
              keyPlaceholder="prop"
              valuePlaceholder="override"
            />
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setResponsive([...responsive, { breakpoint: 'md' }])}
        >
          + Add breakpoint override
        </Button>
      </Section>

      <Section title="Accessibility">
        <Input
          label="Role"
          value={typeof a11y.role === 'string' ? a11y.role : ''}
          placeholder="button"
          onChange={(e) => setA11y({ role: e.target.value })}
        />
        <Input
          label="Label"
          value={typeof a11y.label === 'string' ? a11y.label : ''}
          placeholder="Accessible name"
          onChange={(e) => setA11y({ label: e.target.value })}
        />
        <Input
          label="Tab index"
          type="number"
          value={typeof a11y.tabIndex === 'number' ? a11y.tabIndex : ''}
          onChange={(e) => {
            if (e.target.value === '') {
              const next = { ...a11y }
              delete next.tabIndex
              patchComponent(component.id, { accessibility: next } as Partial<Component>)
            } else {
              const n = Number(e.target.value)
              if (Number.isInteger(n)) setA11y({ tabIndex: n })
            }
          }}
        />
      </Section>

      <Button variant="destructive" size="sm" onClick={() => removeComponentFromPage(component.id)}>
        Delete component
      </Button>
    </div>
  )
}

export default PropertiesPanel
