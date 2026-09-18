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
      type: 'select',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Outline', value: 'outline' },
        { label: 'Ghost', value: 'ghost' },
        { label: 'Link', value: 'link' },
      ],
    },
    size: {
      type: 'select',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
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
    elevation: { type: 'number', min: 0, max: 3, step: 1 },
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
    const shadow = ['shadow-none', 'shadow-sm', 'shadow-md', 'shadow-lg'][elevation] ?? 'shadow-sm'
    return (
      <Card className={`p-4 ${shadow}`} style={pres?.style} {...(pres?.a11y ?? {})}>
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
        logo={<span className="font-semibold text-neutral-900">{String(resolved.logo ?? 'Logo')}</span>}
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

/**
 * Derive an ordered chart palette from project design tokens. Returns the
 * strings that are valid CSS colors; an empty result means "no token colors
 * defined" and the Chart falls back to its built-in palette.
 */
export function deriveChartPalette(colors: unknown): string[] {
  if (!colors || typeof colors !== 'object') return []
  const record = colors as Record<string, unknown>
  const picked: string[] = []
  for (const role of CHART_COLOR_ROLES) {
    const value = record[role]
    if (typeof value === 'string' && value.trim() && isCssColor(value.trim())) {
      picked.push(value.trim())
    }
  }
  return picked
}

const CSS_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-zA-Z]+)$/

function isCssColor(value: string): boolean {
  return CSS_COLOR_RE.test(value)
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
      type: 'array',
      label: 'Datasets',
      arrayFields: {
        label: { type: 'text', label: 'Name' },
        values: { type: 'text', label: 'Values (comma-separated)' },
        color: { type: 'text', label: 'Color' },
        },
      defaultItemProps: { label: 'Series', values: '1, 2, 3' },
      getItemSummary: (item: ChartDatasetRow) => item?.label ?? 'Series',
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
    return (
      <Chart
        type={CHART_TYPES.includes(resolved.type as ChartType) ? (resolved.type as ChartType) : 'bar'}
        data={data}
        palette={palette.length > 0 ? palette : undefined}
        responsive={resolved.responsive !== false}
        style={pres?.style}
        {...(pres?.a11y ?? {})}
      />
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
}

/** Canonical default props for a schema component type (empty object if unknown). */
export function defaultPropsFor(type: string): Record<string, unknown> {
  const config = canvasRegistry[type]
  if (!config) return {}
  return JSON.parse(JSON.stringify((config.defaultProps ?? {}) as Record<string, unknown>))
}
