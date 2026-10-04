import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Navbar } from '../components/ui/Navbar'
import { Chart, type ChartType } from '../components/ui/Chart'
import { Table } from '../components/ui/Table'
import { resolveTokenRefs } from './ComponentRenderer'
import { useSchemaStore } from '../store/schemaStore'
import { useInstancePresentation } from './presentation'
// Website-building sections. Registered alongside the six core types so a
// canvas drop can produce a complete page. Kept in dedicated modules because
// they are large and independent of the core primitives.
import {
  HeroConfig,
  FeaturesConfig,
  PricingConfig,
  TestimonialsConfig,
  FaqConfig,
  CtaBannerConfig,
} from './sections/marketing'
import {
  FooterConfig,
  StatsConfig,
  GalleryConfig,
  ContactFormConfig,
  ArticleConfig,
  LogoCloudConfig,
} from './sections/content'

/**
 * Canvas component registry.
 *
 * Maps universal-schema component types (schemas/component.schema.json) to the
 * real UI components in components/ui, with Puck field definitions, canonical
 * default props (per AGENTS.md component specs), and design-token `$ref`
 * resolution in props.
 */

/** Puck 0.20 has no native boolean field; model it as a Yes/No select. */
const boolField = (label: string) => ({
  type: 'select' as const,
  label,
  options: [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ],
})

/** Chip shell shared by the variant/elevation preset pickers. */
function PresetChip({
  selected,
  title,
  onClick,
  children,
}: {
  selected: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={selected}
      data-testid="preset-chip"
      className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-2 ${
        selected
          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
          : 'border-border bg-card hover:border-border'
      }`}
    >
      {children}
    </button>
  )
}

/** Button variants with token-driven preview classes for the preset chips. */
const VARIANT_PREVIEWS: Array<{ value: string; label: string; className: string }> = [
  { value: 'primary', label: 'Primary', className: 'bg-primary text-primary-foreground' },
  { value: 'secondary', label: 'Secondary', className: 'bg-secondary text-secondary-foreground' },
  { value: 'outline', label: 'Outline', className: 'border border-input bg-background text-foreground' },
  { value: 'ghost', label: 'Ghost', className: 'text-foreground' },
  { value: 'link', label: 'Link', className: 'text-primary underline underline-offset-2' },
]

/**
 * Button variant preset picker: chips preview each variant with the kit's
 * token-driven classes (live project theme colors). One click sets the
 * variant prop; the selected chip is highlighted.
 */
function VariantPresetField({ value, onChange, Label, label }: CustomFieldParams<string>) {
  return (
    <div className="space-y-1" data-testid="variant-preset-field">
      {Label ? (
        <Label label={label} />
      ) : (
        <div className="block text-xs font-medium text-muted-foreground">{label ?? 'Variant'}</div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {VARIANT_PREVIEWS.map((v) => (
          <PresetChip
            key={v.value}
            selected={value === v.value}
            title={`${v.label} variant`}
            onClick={() => onChange(v.value)}
          >
            <span
              aria-hidden
              className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-medium ${v.className}`}
            >
              {v.label}
            </span>
          </PresetChip>
        ))}
      </div>
    </div>
  )
}

/** Button size options with token-driven preview styles for the chips. */
const SIZE_PREVIEWS: Array<{ value: string; label: string; className: string }> = [
  { value: 'sm', label: 'Small', className: 'h-5 px-1.5 text-[10px]' },
  { value: 'md', label: 'Medium', className: 'h-6 px-2 text-[11px]' },
  { value: 'lg', label: 'Large', className: 'h-7 px-2.5 text-xs' },
]

/**
 * Button size preset picker: sm/md/lg chips with padding previews matching
 * the kit's size variants. One click sets the size prop.
 */
function SizePresetField({ value, onChange, Label, label }: CustomFieldParams<string>) {
  return (
    <div className="space-y-1" data-testid="size-preset-field">
      {Label ? (
        <Label label={label} />
      ) : (
        <div className="block text-xs font-medium text-muted-foreground">{label ?? 'Size'}</div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {SIZE_PREVIEWS.map((s) => (
          <PresetChip
            key={s.value}
            selected={value === s.value}
            title={`${s.label} size`}
            onClick={() => onChange(s.value)}
          >
            <span
              aria-hidden
              className={`inline-flex items-center rounded bg-primary text-primary-foreground font-medium ${s.className}`}
            >
              {s.label}
            </span>
          </PresetChip>
        ))}
      </div>
    </div>
  )
}

/**
 * Card elevation preset picker: chips preview shadow-none/sm/md/lg. Shadows
 * come from `--omix-shadow-N` vars (mapped from the project's shadow design
 * tokens) with Tailwind fallbacks; one click sets the numeric elevation.
 */
function ElevationPresetField({ value, onChange, Label, label }: CustomFieldParams<number>) {
  const levels = [0, 1, 2, 3]
  return (
    <div className="space-y-1" data-testid="elevation-preset-field">
      {Label ? (
        <Label label={label} />
      ) : (
        <div className="block text-xs font-medium text-muted-foreground">{label ?? 'Elevation'}</div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {levels.map((level) => (
          <PresetChip
            key={level}
            selected={value === level}
            title={`Elevation ${level}`}
            onClick={() => onChange(level)}
          >
            <span
              aria-hidden
              className="block h-3 w-5 rounded bg-card"
              style={{
                boxShadow:
                  level === 0
                    ? 'none'
                    : `var(--omix-shadow-${level}, 0 1px 2px 0 rgb(0 0 0 / 0.1))`,
              }}
            />
          </PresetChip>
        ))}
      </div>
    </div>
  )
}

/** Schema variant (primary|secondary|…) → cva variant of the UI Button. */
function mapButtonVariant(variant: unknown): string {
  switch (variant) {
    case 'primary':
      return 'default'
    case 'secondary':
      return 'secondary'
    case 'outline':
      return 'outline'
    case 'ghost':
      return 'ghost'
    case 'link':
      return 'link'
    default:
      return 'default'
  }
}

/** Schema size (sm|md|lg) → cva size of the UI Button. */
function mapButtonSize(size: unknown): 'sm' | 'default' | 'lg' {
  if (size === 'sm') return 'sm'
  if (size === 'lg') return 'lg'
  return 'default'
}

/** Read project design tokens inside a Puck render function (it is a component). */
function useDesignTokens() {
  return useSchemaStore((s) => s.project?.designTokens)
}

/** Shared render props: Puck injects `id` and `puck` into every render. */
interface BaseRenderProps extends Record<string, unknown> {
  id: string
  puck: unknown
}

function useResolved<P extends Record<string, unknown>>(props: P): P {
  const tokens = useDesignTokens()
  return resolveTokenRefs(props, tokens)
}

// --- Button ---

interface ButtonRenderProps extends BaseRenderProps {
  label?: string
  variant?: string
  size?: string
  disabled?: boolean
  icon?: string
  backgroundColor?: unknown
}

const ButtonConfig: ComponentConfig = {
  fields: {
    label: { type: 'text' },
    variant: {
      type: 'custom',
      label: 'Variant',
      render: (params: CustomFieldParams<string>) => <VariantPresetField {...params} />,
    },
    size: {
      type: 'custom',
      label: 'Size',
      render: (params: CustomFieldParams<string>) => <SizePresetField {...params} />,
    },
    disabled: boolField('Disabled'),
    icon: { type: 'text', label: 'Icon (glyph)' },
  },
  defaultProps: {
    label: 'Button',
    variant: 'primary',
    size: 'md',
    disabled: false,
    icon: '',
  },
  render: (props: ButtonRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    return (
      <Button
        variant={mapButtonVariant(resolved.variant) as 'default'}
        size={mapButtonSize(resolved.size)}
        disabled={Boolean(resolved.disabled)}
        icon={resolved.icon ? String(resolved.icon) : undefined}
        style={{
          ...pres?.style,
          ...(typeof resolved.backgroundColor === 'string'
            ? { backgroundColor: resolved.backgroundColor }
            : {}),
        }}
        {...(pres?.a11y ?? {})}
      >
        {String(resolved.label ?? 'Button')}
      </Button>
    )
  },
}

// --- Input ---

interface InputRenderProps extends BaseRenderProps {
  label?: string
  placeholder?: string
  type?: string
  required?: boolean
}

const InputConfig: ComponentConfig = {
  fields: {
    label: { type: 'text' },
    placeholder: { type: 'text' },
    type: { type: 'text' },
    required: boolField('Required'),
  },
  defaultProps: {
    label: 'Label',
    placeholder: 'Enter text',
    type: 'text',
    required: false,
  },
  render: (props: InputRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    return (
      <Input
        label={resolved.label ? String(resolved.label) : undefined}
        type={resolved.type ? String(resolved.type) : 'text'}
        placeholder={resolved.placeholder ? String(resolved.placeholder) : undefined}
        required={Boolean(resolved.required)}
        style={pres?.style}
        {...(pres?.a11y ?? {})}
      />
    )
  },
}

// --- Card ---

interface CardRenderProps extends BaseRenderProps {
  header?: string
  content?: string
  footer?: string
  elevation?: number
}

const CardConfig: ComponentConfig = {
  fields: {
    header: { type: 'text' },
    content: { type: 'textarea' },
    footer: { type: 'text' },
    elevation: {
      type: 'custom',
      label: 'Elevation',
      render: (params: CustomFieldParams<number>) => <ElevationPresetField {...params} />,
    },
  },
  defaultProps: {
    header: 'Card header',
    content: 'Card content goes here.',
    footer: '',
    elevation: 1,
  },
  render: (props: CardRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const elevation = typeof resolved.elevation === 'number' ? resolved.elevation : 1
    // Shadows come from the project's shadow tokens (--omix-shadow-N, mapped
    // in themeVars) with Tailwind-equivalent fallbacks, matching the
    // elevation preset chips exactly.
    const SHADOW_FALLBACKS: Record<number, string> = {
      1: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      2: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      3: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    }
    const shadowStyle =
      elevation === 0
        ? { boxShadow: 'none' }
        : { boxShadow: `var(--omix-shadow-${elevation}, ${SHADOW_FALLBACKS[elevation] ?? SHADOW_FALLBACKS[1]})` }
    return (
      <Card
        className="p-4"
        style={{ ...shadowStyle, ...(pres?.style ?? {}) }}
        {...(pres?.a11y ?? {})}
      >
        {resolved.header ? (
          <h3 className="text-base font-semibold text-card-foreground mb-1">
            {String(resolved.header)}
          </h3>
        ) : null}
        {resolved.content ? (
          <p className="text-sm text-muted-foreground">{String(resolved.content)}</p>
        ) : null}
        {resolved.footer ? (
          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            {String(resolved.footer)}
          </div>
        ) : null}
      </Card>
    )
  },
}

// --- Navbar ---

interface NavbarLink {
  label: string
  href: string
}

interface NavbarRenderProps extends BaseRenderProps {
  logo?: string
  links?: NavbarLink[]
  sticky?: boolean
  transparent?: boolean
}

const NavbarConfig: ComponentConfig = {
  fields: {
    logo: { type: 'text' },
    links: {
      type: 'array',
      arrayFields: {
        label: { type: 'text' },
        href: { type: 'text' },
      },
      defaultItemProps: { label: 'Link', href: '#' },
      getItemSummary: (item: NavbarLink) => item?.label ?? 'Link',
    },
    sticky: boolField('Sticky'),
    transparent: boolField('Transparent'),
  },
  defaultProps: {
    logo: 'Logo',
    links: [
      { label: 'Home', href: '#' },
      { label: 'About', href: '#about' },
    ],
    sticky: false,
    transparent: false,
  },
  render: (props: NavbarRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const links = Array.isArray(resolved.links) ? resolved.links : []
    return (
      <Navbar
        logo={<span className="font-semibold text-foreground">{String(resolved.logo ?? 'Logo')}</span>}
        links={links.map((link) => ({ label: String(link?.label ?? ''), href: String(link?.href ?? '#') }))}
        sticky={Boolean(resolved.sticky)}
        transparent={Boolean(resolved.transparent)}
        style={pres?.style}
        {...(pres?.a11y ?? {})}
      />
    )
  },
}

// --- Chart ---

/** Chart payload shape: { labels, datasets: [{ label, data, color? }] }. */
interface ChartDataProp {
  labels?: string[]
  datasets?: Array<{ label?: string; data: number[]; color?: string }>
}

/** One editable dataset row: series name + comma-separated values + color. */
interface ChartDatasetRow {
  label?: string
  values?: string
  color?: string
}

interface ChartRenderProps extends BaseRenderProps {
  type?: ChartType
  data?: ChartDataProp | Record<string, unknown>
  /** Puck-editable category labels (repeatable text rows). */
  chartLabels?: string[]
  /** Puck-editable dataset rows (repeatable: name / values / color). */
  datasets?: ChartDatasetRow[]
  responsive?: boolean
}

const CHART_TYPES: ChartType[] = ['line', 'bar', 'pie', 'doughnut', 'area']

/** Series-color order: the token roles most suited to categorical data first. */
const CHART_COLOR_ROLES = [
  'primary',
  'success',
  'warning',
  'error',
  'secondary',
  'accent',
  'info',
] as const

/** One token-derived palette entry: the design-token role and its color. */
export interface ChartPaletteEntry {
  role: string
  value: string
}

/**
 * Derive the ordered chart palette from project design tokens, keeping the
 * role each color came from so editors can label token preset swatches.
 * Invalid/non-color values are skipped; an empty result means "no token
 * colors defined" and the Chart falls back to its built-in palette.
 */
export function deriveChartPaletteEntries(colors: unknown): ChartPaletteEntry[] {
  if (!colors || typeof colors !== 'object') return []
  const record = colors as Record<string, unknown>
  const picked: ChartPaletteEntry[] = []
  for (const role of CHART_COLOR_ROLES) {
    const value = record[role]
    if (typeof value === 'string' && value.trim() && isCssColor(value.trim())) {
      picked.push({ role, value: value.trim() })
    }
  }
  return picked
}

/**
 * Derive an ordered chart palette from project design tokens. Returns the
 * strings that are valid CSS colors; an empty result means "no token colors
 * defined" and the Chart falls back to its built-in palette.
 */
export function deriveChartPalette(colors: unknown): string[] {
  return deriveChartPaletteEntries(colors).map((entry) => entry.value)
}

const CSS_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-zA-Z]+)$/

function isCssColor(value: string): boolean {
  return CSS_COLOR_RE.test(value)
}

/**
 * Convert a stored color to the `#rrggbb` form that `<input type="color">`
 * requires. Handles hex (3/6-digit) and rgb()/rgba(); named colors and other
 * formats return null (the swatch still displays them via CSS, but the picker
 * falls back to its default until a color is chosen). Empty/invalid → null,
 * which the swatch field renders as the "inherit from theme" state.
 */
export function normalizeToHex(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (!v) return null
  if (/^#[0-9a-f]{6}$/.test(v)) return v
  if (/^#[0-9a-f]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
  }
  const rgb = v.match(/^rgba?\(\s*(-?\d+)[,\s]+(-?\d+)[,\s]+(-?\d+)/)
  if (rgb) {
    const chan = (n: string) =>
      Math.min(255, Math.max(0, Number(n)))
        .toString(16)
        .padStart(2, '0')
    return `#${chan(rgb[1])}${chan(rgb[2])}${chan(rgb[3])}`
  }
  return null
}

/** Props Puck injects into custom-field renders (Label is Puck's styled label). */
interface CustomFieldParams<Value> {
  value?: Value
  onChange: (value: Value) => void
  Label?: React.ComponentType<{ label?: React.ReactNode; children?: React.ReactNode }>
  label?: string
}

/** Defaults for a newly added dataset row. */
const DATASET_ITEM_DEFAULTS: ChartDatasetRow = { label: 'Series', values: '1, 2, 3' }

/**
 * Repeatable dataset-row editor with a live color dot per row (visible even
 * when collapsed). Rows expand in place to reveal name/values/color editors
 * plus duplicate/remove actions. Rendered by both Puck's field panel and the
 * app PropertiesPanel via the custom-field render contract; uses Puck's
 * `Label` when provided, otherwise falls back to a plain label.
 */
function DatasetsField({
  value,
  onChange,
  Label,
  label,
}: CustomFieldParams<ChartDatasetRow[]>) {
  const rows = Array.isArray(value) ? value : []
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const setRow = (index: number, patch: Partial<ChartDatasetRow>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }
  return (
    <div className="space-y-1.5" data-testid="datasets-field">
      {Label ? (
        <Label label={label}>{null}</Label>
      ) : (
        <div className="block text-xs font-medium text-muted-foreground">{label ?? 'Datasets'}</div>
      )}
      {rows.map((row, index) => {
        const { css } = resolveSwatchColor(row?.color)
        const isOpen = openIndex === index
        return (
          <div key={index} className="rounded-md border border-border">
            <button
              type="button"
              data-testid="dataset-row-summary"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-foreground/80"
            >
              <span
                aria-hidden
                data-testid="dataset-row-dot"
                title={css ?? 'Inherit from theme'}
                className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                style={{ background: css ?? SWATCH_INHERIT_BG }}
              />
              <span className="min-w-0 flex-1 truncate">
                {row?.label?.trim() || `Series ${index + 1}`}
              </span>
              <span aria-hidden className="text-muted-foreground">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="space-y-1.5 border-t border-border p-2">
                <Input
                  label="Name"
                  value={typeof row?.label === 'string' ? row.label : ''}
                  onChange={(e) => setRow(index, { label: e.target.value })}
                />
                <Input
                  label="Values (comma-separated)"
                  value={typeof row?.values === 'string' ? row.values : ''}
                  onChange={(e) => setRow(index, { values: e.target.value })}
                />
                <ColorSwatchField
                  value={typeof row?.color === 'string' ? row.color : ''}
                  onChange={(color) => setRow(index, { color })}
                />
                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onChange([
                        ...rows.slice(0, index + 1),
                        { ...DATASET_ITEM_DEFAULTS },
                        ...rows.slice(index + 1),
                      ])
                    }
                  >
                    Duplicate
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}
      <Button variant="outline" size="sm" onClick={() => onChange([...rows, { ...DATASET_ITEM_DEFAULTS }])}>
        + Add dataset
      </Button>
    </div>
  )
}

/**
 * Resolve a dataset color into display values: `css` is any valid CSS color
 * (chips/dots show it as-is), `hex` is the `#rrggbb` form for `<input
 * type="color">`. Null `css` means "inherit from theme" — callers render a
 * striped placeholder.
 */
export function resolveSwatchColor(value: unknown): { css: string | null; hex: string | null } {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw || !isCssColor(raw)) return { css: null, hex: null }
  return { css: raw, hex: normalizeToHex(raw) }
}

/** Striped placeholder for the "inherit from theme" swatch state. */
export const SWATCH_INHERIT_BG = 'repeating-linear-gradient(45deg, #e2e8f0 0 4px, #f8fafc 4px 8px)'

/**
 * Swatch color picker for dataset rows: a color chip opening the native
 * color picker, the current value as text, token preset chips for one-click
 * theming, and a clear action that restores inheritance from the project's
 * design-token palette. Custom Puck field — receives `value`/`onChange`
 * from Puck's field renderer.
 */
export function ColorSwatchField({
  value,
  onChange,
  Label,
  label,
}: CustomFieldParams<string>) {
  const raw = typeof value === 'string' ? value.trim() : ''
  const { css: chipColor, hex } = resolveSwatchColor(raw)
  const swatchBackground = chipColor ?? SWATCH_INHERIT_BG
  // One-click presets from the project's design tokens, in series-color order.
  const presets = deriveChartPaletteEntries(useDesignTokens()?.colors)
  return (
    <div className="space-y-1" data-testid="color-swatch-field">
      {Label && <Label label={label} />}
      <div className="flex items-center gap-2">
        <label
          className="relative inline-block h-7 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border"
          title={chipColor ?? 'Inherit from theme'}
        >
          <span aria-hidden className="block h-full w-full" style={{ background: swatchBackground }} />
          <input
            type="color"
            aria-label="Series color"
            value={hex ?? '#2563eb'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {chipColor ?? 'Inherit'}
        </span>
        {chipColor && (
          <button
            type="button"
            aria-label="Clear color"
            title="Clear — inherit from theme"
            onClick={() => onChange('')}
            className="shrink-0 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>
      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {presets.map((p) => (
            <button
              key={p.role}
              type="button"
              aria-label={`Use ${p.role} color`}
              title={`${p.role} — ${p.value}`}
              onClick={() => onChange(p.value)}
              className={`h-4 w-4 rounded-full border ${
                raw === p.value ? 'border-foreground' : 'border-black/10'
              }`}
              style={{ background: p.value }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const DEFAULT_CHART_DATA: ChartDataProp = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [
    { label: 'Revenue', data: [12, 30, 18, 24] },
    { label: 'Costs', data: [8, 14, 11, 9], color: '#10b981' },
  ],
}

/** Default dataset rows mirror DEFAULT_CHART_DATA for the Puck panel. */
const DEFAULT_DATASET_ROWS: ChartDatasetRow[] = [
  { label: 'Revenue', values: '12, 30, 18, 24' },
  { label: 'Costs', values: '8, 14, 11, 9', color: '#10b981' },
]

/**
 * Parse the comma-separated values field into numbers. Everything outside
 * ranges is treated as a separator, so `"1, 2 ,3"`, `"1;2;3"` and `"1 2 3"
 * all work; non-numeric fragments are dropped instead of breaking the chart.
 */
export function parseChartValues(input: unknown): number[] {
  if (typeof input !== 'string') {
    return Array.isArray(input)
      ? input.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
      : []
  }
  const matches = input.match(/-?\d+(?:\.\d+)?/g) ?? []
  return matches.map(Number)
}

/**
 * Resolve the chart's data from the structured Puck fields. Precedence:
 * programmatic `data` prop > `datasets`/`chartLabels` rows > built-in
 * defaults, so the panel always edits a live, chart-backed series list.
 */
export function resolveChartData(
  resolved: Pick<ChartRenderProps, 'data' | 'chartLabels' | 'datasets'>
): ChartDataProp | null {
  if (resolved.data && typeof resolved.data === 'object') {
    return resolved.data as ChartDataProp
  }
  if (Array.isArray(resolved.datasets)) {
    const labels = Array.isArray(resolved.chartLabels)
      ? resolved.chartLabels.filter((l): l is string => typeof l === 'string')
      : []
    const datasets = resolved.datasets
      .filter((row): row is ChartDatasetRow => Boolean(row) && typeof row === 'object')
      .map((row) => {
        const dataset: { label?: string; data: number[]; color?: string } = {
          data: parseChartValues(row.values),
        }
        if (typeof row.label === 'string' && row.label.trim()) dataset.label = row.label
        if (typeof row.color === 'string' && isCssColor(row.color.trim())) {
          dataset.color = row.color.trim()
        }
        return dataset
      })
    return { labels, datasets }
  }
  return DEFAULT_CHART_DATA
}

export interface ChartLengthWarning {
  /** Dataset name, or `Dataset 3` (1-based index) when unnamed. */
  series: string
  /** Number of values in the dataset row. */
  values: number
  /** Number of category labels on the chart. */
  labels: number
}

/**
 * Compare each dataset's value count against the label count. Returns one
 * entry per mismatched series (mismatch = either side non-empty and unequal);
 * an empty result means the data is consistent. The chart still renders —
 * this powers the inline editor warning, not validation gating.
 */
export function getChartLengthWarnings(data: ChartDataProp | null): ChartLengthWarning[] {
  if (!data) return []
  const labelCount = data.labels?.length ?? 0
  if (!labelCount) return []
  const warnings: ChartLengthWarning[] = []
  ;(data.datasets ?? []).forEach((ds, index) => {
    const valueCount = ds?.data?.length ?? 0
    if (valueCount === labelCount) return
    warnings.push({
      series: ds?.label?.trim() || `Dataset ${index + 1}`,
      values: valueCount,
      labels: labelCount,
    })
  })
  return warnings
}

const ChartConfig: ComponentConfig = {
  fields: {
    type: {
      type: 'select',
      options: [
        { label: 'Line', value: 'line' },
        { label: 'Bar', value: 'bar' },
        { label: 'Pie', value: 'pie' },
        { label: 'Doughnut', value: 'doughnut' },
        { label: 'Area', value: 'area' },
      ],
    },
    // Repeatable category labels + dataset rows (label / values / color).
    chartLabels: {
      type: 'array',
      label: 'Categories',
      arrayFields: { label: { type: 'text', label: 'Label' } },
      getItemSummary: (item: unknown) =>
        typeof item === 'string' ? item : (item as { label?: string })?.label ?? 'Label',
    },
    datasets: {
      type: 'custom',
      label: 'Datasets',
      render: (params: CustomFieldParams<ChartDatasetRow[]>) => <DatasetsField {...params} />,
    },
    responsive: boolField('Responsive'),
  },
  defaultProps: {
    type: 'bar',
    chartLabels: DEFAULT_CHART_DATA.labels,
    datasets: DEFAULT_DATASET_ROWS,
    responsive: true,
  },
  render: (props: ChartRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    // Series colors follow the project theme; empty palette -> Chart's built-ins.
    const palette = deriveChartPalette(useDesignTokens()?.colors)
    if (pres && !pres.visible) return <></>
    const data = resolveChartData(resolved)
    const warnings = getChartLengthWarnings(data)
    return (
      <>
        <Chart
          type={CHART_TYPES.includes(resolved.type as ChartType) ? (resolved.type as ChartType) : 'bar'}
          data={data}
          palette={palette.length > 0 ? palette : undefined}
          responsive={resolved.responsive !== false}
          style={pres?.style}
          {...(pres?.a11y ?? {})}
        />
        {warnings.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-amber-600" role="status">
            {warnings.map((w) => (
              <li key={w.series}>
                ⚠ {w.series}: {w.values} {w.values === 1 ? 'value' : 'values'} for {w.labels}{' '}
                {w.labels === 1 ? 'label' : 'labels'}
              </li>
            ))}
          </ul>
        )}
      </>
    )
  },
}

// --- Table ---

interface TableColumn {
  key: string
  label: string
}

interface TableRenderProps extends BaseRenderProps {
  columns?: TableColumn[]
  data?: Array<Record<string, unknown>>
  sortable?: boolean
  filterable?: boolean
}

const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
]

const DEFAULT_TABLE_DATA: Array<Record<string, unknown>> = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
]

const TableConfig: ComponentConfig = {
  fields: {
    columns: {
      type: 'array',
      arrayFields: {
        key: { type: 'text' },
        label: { type: 'text' },
      },
      defaultItemProps: { key: 'column', label: 'Column' },
      getItemSummary: (item: TableColumn) => item?.label ?? item?.key ?? 'Column',
    },
    sortable: boolField('Sortable'),
    filterable: boolField('Filterable'),
  },
  defaultProps: {
    columns: DEFAULT_TABLE_COLUMNS,
    data: DEFAULT_TABLE_DATA,
    sortable: false,
    filterable: false,
  },
  render: (props: TableRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const columns = Array.isArray(resolved.columns) && resolved.columns.length
      ? resolved.columns
      : DEFAULT_TABLE_COLUMNS
    const data = Array.isArray(resolved.data) ? resolved.data : DEFAULT_TABLE_DATA
    return (
      <Table
        columns={columns.map((col) => ({
          key: String(col?.key ?? ''),
          label: String(col?.label ?? col?.key ?? ''),
        }))}
        data={data}
        sortable={Boolean(resolved.sortable)}
        filterable={Boolean(resolved.filterable)}
        style={pres?.style}
        {...(pres?.a11y ?? {})}
      />
    )
  },
}

// --- Registry ---

export const canvasRegistry: Record<string, ComponentConfig> = {
  Button: ButtonConfig,
  Input: InputConfig,
  Card: CardConfig,
  Navbar: NavbarConfig,
  Chart: ChartConfig,
  Table: TableConfig,
  // Sections
  Hero: HeroConfig,
  CtaBanner: CtaBannerConfig,
  Footer: FooterConfig,
  Stats: StatsConfig,
  // Marketing
  Features: FeaturesConfig,
  Pricing: PricingConfig,
  Testimonials: TestimonialsConfig,
  Faq: FaqConfig,
  // Content
  Article: ArticleConfig,
  Gallery: GalleryConfig,
  LogoCloud: LogoCloudConfig,
  // Forms
  ContactForm: ContactFormConfig,
}

/** Canonical default props for a schema component type (empty object if unknown). */
export function defaultPropsFor(type: string): Record<string, unknown> {
  const config = canvasRegistry[type]
  if (!config) return {}
  return JSON.parse(JSON.stringify((config.defaultProps ?? {}) as Record<string, unknown>))
}
