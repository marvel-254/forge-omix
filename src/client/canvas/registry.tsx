import type { ComponentConfig } from '@measured/puck'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Navbar } from '../components/ui/Navbar'
import { Chart } from '../components/ui/Chart'
import { Table } from '../components/ui/Table'
import { resolveTokenRefs } from './ComponentRenderer'
import { useSchemaStore } from '../store/schemaStore'

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
  },
  defaultProps: {
    label: 'Button',
    variant: 'primary',
    size: 'md',
    disabled: false,
  },
  render: (props: ButtonRenderProps) => {
    const resolved = useResolved(props as unknown as Record<string, unknown>)
    return (
      <Button
        variant={mapButtonVariant(resolved.variant) as 'default'}
        size={mapButtonSize(resolved.size)}
        disabled={Boolean(resolved.disabled)}
        style={
          typeof resolved.backgroundColor === 'string'
            ? { backgroundColor: resolved.backgroundColor }
            : undefined
        }
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
    const resolved = useResolved(props as unknown as Record<string, unknown>)
    return (
      <Input
        label={resolved.label ? String(resolved.label) : undefined}
        type={resolved.type ? String(resolved.type) : 'text'}
        placeholder={resolved.placeholder ? String(resolved.placeholder) : undefined}
        required={Boolean(resolved.required)}
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
    const resolved = useResolved(props as unknown as Record<string, unknown>)
    const elevation = typeof resolved.elevation === 'number' ? resolved.elevation : 1
    const shadow = ['shadow-none', 'shadow-sm', 'shadow-md', 'shadow-lg'][elevation] ?? 'shadow-sm'
    return (
      <Card className={`p-4 ${shadow}`}>
        {resolved.header ? (
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            {String(resolved.header)}
          </h3>
        ) : null}
        {resolved.content ? (
          <p className="text-sm text-neutral-600">{String(resolved.content)}</p>
        ) : null}
        {resolved.footer ? (
          <div className="mt-3 pt-3 border-t text-xs text-neutral-500">
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
    const resolved = useResolved(props as unknown as Record<string, unknown>)
    const links = Array.isArray(resolved.links) ? resolved.links : []
    return (
      <Navbar
        logo={<span className="font-semibold text-neutral-900">{String(resolved.logo ?? 'Logo')}</span>}
        links={links.map((link) => ({ label: String(link?.label ?? ''), href: String(link?.href ?? '#') }))}
        sticky={Boolean(resolved.sticky)}
        transparent={Boolean(resolved.transparent)}
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

interface ChartRenderProps extends BaseRenderProps {
  type?: 'line' | 'bar' | 'pie'
  data?: ChartDataProp | Record<string, unknown>
  /** JSON string of ChartDataProp, editable from Puck's field panel. */
  dataJson?: string
  responsive?: boolean
}

const DEFAULT_CHART_DATA: ChartDataProp = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [
    { label: 'Revenue', data: [12, 30, 18, 24] },
    { label: 'Costs', data: [8, 14, 11, 9], color: '#10b981' },
  ],
}

const ChartConfig: ComponentConfig = {
  fields: {
    type: {
      type: 'select',
      options: [
        { label: 'Line', value: 'line' },
        { label: 'Bar', value: 'bar' },
        { label: 'Pie', value: 'pie' },
      ],
    },
    // JSON edit field for { labels, datasets }; parsed and validated on render.
    dataJson: { type: 'textarea', label: 'Data (JSON)' },
    responsive: boolField('Responsive'),
  },
  defaultProps: {
    type: 'bar',
    dataJson: JSON.stringify(DEFAULT_CHART_DATA, null, 2),
    responsive: true,
  },
  render: (props: ChartRenderProps) => {
    const resolved = useResolved(props as unknown as Record<string, unknown>)
    // `data` prop wins when present (e.g. programmatic use); otherwise the
    // Puck-editable dataJson field is parsed.
    let data: ChartDataProp | null = null
    if (resolved.data && typeof resolved.data === 'object') {
      data = resolved.data as ChartDataProp
    } else if (typeof resolved.dataJson === 'string' && resolved.dataJson.trim()) {
      try {
        const parsed = JSON.parse(resolved.dataJson)
        if (parsed && typeof parsed === 'object') data = parsed as ChartDataProp
      } catch {
        // Invalid JSON — render the empty state below.
      }
    }
    return (
      <Chart
        type={resolved.type === 'line' || resolved.type === 'pie' ? resolved.type : 'bar'}
        data={data}
        responsive={resolved.responsive !== false}
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
    const resolved = useResolved(props as unknown as Record<string, unknown>)
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
