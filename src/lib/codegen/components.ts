import type { Component, DesignTokens } from '../../server/types/schema'
import { escAttr, escText, jsString } from './escape'

/**
 * Component-to-JSX mapping (docs/07 §7.3). Each schema component becomes a
 * usage of the generated `components/ui.tsx` kit, with static token
 * resolution, accessibility attributes, interaction handlers, and
 * responsive overrides via the generated `useResponsiveProps` hook.
 */

export interface ComponentGenContext {
  tokens?: DesignTokens | null
}

export interface GeneratedComponent {
  /** Hook lines to place at the top of the page component. */
  hooks: string[]
  /** JSX expression for the component (may be conditional). */
  jsx: string
  /** True when the page needs `useNavigate` from react-router-dom. */
  needsNavigate: boolean
}

type Comp = Record<string, unknown>

function asComp(component: Component): Comp {
  return component as unknown as Comp
}

function propsOf(component: Component): Record<string, unknown> {
  const p = asComp(component).props
  return p && typeof p === 'object' ? (p as Record<string, unknown>) : {}
}

/** Resolve a `{ $ref }` against tokens at generation time (static output). */
export function resolveStaticRef(value: unknown, tokens?: DesignTokens | null): unknown {
  if (!tokens || !value || typeof value !== 'object' || !('$ref' in value)) {
    return value
  }
  const path = String((value as { $ref: unknown }).$ref)
    .replace(/^designTokens\./, '')
    .split('.')
  let current: unknown = tokens
  for (const segment of path) {
    if (current && typeof current === 'object' && segment in (current as object)) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      return undefined
    }
  }
  return current !== undefined && typeof current !== 'object' ? current : undefined
}

const kebabToCamel = (key: string) => key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

/** `styles.base` → JSX `style={{ … }}` attribute (empty string when none). */
export function styleAttr(component: Component, ctx: ComponentGenContext): string {
  const styles = asComp(component).styles as { base?: Record<string, unknown> } | undefined
  const base = styles?.base
  if (!base || typeof base !== 'object') return ''
  const entries: string[] = []
  for (const [key, value] of Object.entries(base)) {
    const resolved = resolveStaticRef(value, ctx.tokens) ?? value
    if (typeof resolved === 'string' || typeof resolved === 'number') {
      entries.push(`${kebabToCamel(key)}: ${JSON.stringify(resolved)}`)
    }
  }
  return entries.length > 0 ? ` style={{ ${entries.join(', ')} }}` : ''
}

/** `accessibility` → role / aria-* / tabIndex attributes. */
export function a11yAttrs(component: Component): string {
  const a11y = asComp(component).accessibility as Record<string, unknown> | undefined
  if (!a11y || typeof a11y !== 'object') return ''
  const out: string[] = []
  if (typeof a11y.role === 'string' && a11y.role) out.push(`role="${escAttr(a11y.role)}"`)
  if (typeof a11y.label === 'string' && a11y.label) out.push(`aria-label="${escAttr(a11y.label)}"`)
  if (typeof a11y.labelledBy === 'string' && a11y.labelledBy) {
    out.push(`aria-labelledby="${escAttr(a11y.labelledBy)}"`)
  }
  if (typeof a11y.describedBy === 'string' && a11y.describedBy) {
    out.push(`aria-describedby="${escAttr(a11y.describedBy)}"`)
  }
  if (typeof a11y.tabIndex === 'number') out.push(`tabIndex={${a11y.tabIndex}}`)
  return out.length > 0 ? ' ' + out.join(' ') : ''
}

interface ResponsiveMaps {
  propOverrides: Record<string, Record<string, unknown>>
  hidden: Record<string, boolean>
}

function responsiveMaps(component: Component): ResponsiveMaps {
  const entries = asComp(component).responsive
  const propOverrides: Record<string, Record<string, unknown>> = {}
  const hidden: Record<string, boolean> = {}
  if (Array.isArray(entries)) {
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue
      const e = entry as { breakpoint?: string; props?: Record<string, unknown>; hidden?: boolean }
      if (typeof e.breakpoint !== 'string') continue
      if (e.props && typeof e.props === 'object') propOverrides[e.breakpoint] = e.props
      if (e.hidden === true) hidden[e.breakpoint] = true
    }
  }
  return { propOverrides, hidden }
}

interface RespCtx {
  varName: string
  overridden: Set<string>
  hooks: string[]
  hiddenExpr: string | null
}

/** Emit `useResponsiveProps`/`useResponsiveHidden` hooks for one component. */
function setupResponsive(
  varName: string,
  baseProps: Record<string, unknown>,
  maps: ResponsiveMaps
): RespCtx {
  const overridden = new Set(Object.values(maps.propOverrides).flatMap((o) => Object.keys(o)))
  const hooks: string[] = []
  if (overridden.size > 0) {
    const base: Record<string, unknown> = {}
    for (const key of overridden) base[key] = baseProps[key]
    // Loose record typing: overrides may introduce keys absent from base
    // (e.g. a placeholder that only exists at one breakpoint). All reads
    // go through `ref()` casts, so strictness is preserved at use sites.
    hooks.push(
      `  const ${varName}R = useResponsiveProps(${JSON.stringify(base)} as Record<string, unknown>, ${JSON.stringify(maps.propOverrides)} as Record<string, Record<string, unknown>>);`
    )
  }
  let hiddenExpr: string | null = null
  if (Object.keys(maps.hidden).length > 0) {
    hooks.push(`  const ${varName}H = useResponsiveHidden(${JSON.stringify(maps.hidden)});`)
    hiddenExpr = `${varName}H`
  }
  return { varName, overridden, hooks, hiddenExpr }
}

/**
 * Reference one scalar prop: the responsive-hook value when overridden,
 * otherwise the static literal. `cast` keeps generated TypeScript strict
 * (hook values are `unknown`).
 */
function ref(R: RespCtx, key: string, literal: string, cast?: string): string {
  if (!R.overridden.has(key)) return literal
  return `{${R.varName}R.${key}${cast ? ` as ${cast}` : ''}}`
}

function maybeHidden(R: RespCtx, jsx: string): string {
  return R.hiddenExpr ? `{!${R.hiddenExpr} && (\n      ${jsx}\n    )}` : jsx
}

/** `interactions.onClick/onSubmit` → handler attribute (navigate/apiCall only). */
function interactionHandler(
  component: Component,
  event: 'onClick' | 'onSubmit'
): { attr: string; needsNavigate: boolean } {
  const interactions = asComp(component).interactions as Record<string, unknown> | undefined
  const handler = interactions?.[event] as
    | { type?: string; target?: string; method?: string }
    | undefined
  if (!handler || typeof handler !== 'object') return { attr: '', needsNavigate: false }
  if (handler.type === 'navigate' && typeof handler.target === 'string') {
    return { attr: ` ${event}={() => navigate(${jsString(handler.target)})}`, needsNavigate: true }
  }
  if (handler.type === 'apiCall' && typeof handler.target === 'string') {
    const method = typeof handler.method === 'string' ? handler.method : 'GET'
    return {
      attr: ` ${event}={() => { void fetch(${jsString(handler.target)}, { method: ${jsString(method)} }); }}`,
      needsNavigate: false,
    }
  }
  return { attr: '', needsNavigate: false }
}

const BUTTON_VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'link']
const BUTTON_SIZES = ['sm', 'md', 'lg']

function generateButton(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const variant = BUTTON_VARIANTS.includes(String(props.variant)) ? String(props.variant) : 'primary'
  const size = BUTTON_SIZES.includes(String(props.size)) ? String(props.size) : 'md'
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const { attr: onClick, needsNavigate } = interactionHandler(component, 'onClick')
  const disabled = props.disabled === true ? ' disabled' : ''
  const icon =
    typeof props.icon === 'string' && props.icon ? ` icon=${jsString(props.icon)}` : ''
  const jsx =
    `<Button variant=${ref(R, 'variant', `"${variant}"`, `'primary' | 'secondary' | 'outline' | 'ghost' | 'link'`)}` +
    ` size=${ref(R, 'size', `"${size}"`, `'sm' | 'md' | 'lg'`)}${disabled}${icon}${onClick}` +
    `${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `${R.overridden.has('label') ? `{${R.varName}R.label as string}` : escText(props.label ?? 'Button')}</Button>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate }
}

function generateInput(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const label =
    typeof props.label === 'string'
      ? ` label=${ref(R, 'label', jsString(props.label), 'string')}`
      : ''
  const type =
    typeof props.type === 'string' && props.type
      ? ` type=${ref(R, 'type', jsString(props.type), 'string')}`
      : ''
  const placeholder =
    typeof props.placeholder === 'string'
      ? ` placeholder=${ref(R, 'placeholder', jsString(props.placeholder), 'string')}`
      : R.overridden.has('placeholder')
        ? ` placeholder=${ref(R, 'placeholder', '""', 'string')}`
        : ''
  const required =
    props.required === true
      ? ' required'
      : R.overridden.has('required')
        ? ` required={${R.varName}R.required as boolean}`
        : ''
  const { attr: onSubmit } = interactionHandler(component, 'onSubmit')
  const jsx =
    `<Input${label}${type}${placeholder}${required}${onSubmit}` +
    `${styleAttr(component, ctx)}${a11yAttrs(component)} />`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generateCard(
  component: Component,
  ctx: ComponentGenContext,
  varName: string,
  children: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const { attr: onClick, needsNavigate } = interactionHandler(component, 'onClick')
  const text = (key: string, fallback: string): string =>
    R.overridden.has(key) ? `{${R.varName}R.${key} as string}` : escText(fallback)
  const parts: string[] = []
  if (typeof props.header === 'string' && props.header) {
    parts.push(`<h3>${text('header', props.header)}</h3>`)
  } else if (R.overridden.has('header')) {
    parts.push(`<h3>{${R.varName}R.header as string}</h3>`)
  }
  if (typeof props.content === 'string' && props.content) {
    parts.push(`<p>${text('content', props.content)}</p>`)
  } else if (R.overridden.has('content')) {
    parts.push(`<p>{${R.varName}R.content as string}</p>`)
  }
  if (children) parts.push(children)
  if (typeof props.footer === 'string' && props.footer) {
    parts.push(`<footer>${text('footer', props.footer)}</footer>`)
  } else if (R.overridden.has('footer')) {
    parts.push(`<footer>{${R.varName}R.footer as string}</footer>`)
  }
  const elevation =
    typeof props.elevation === 'number'
      ? ` elevation=${ref(R, 'elevation', `{${props.elevation}}`, 'number')}`
      : R.overridden.has('elevation')
        ? ` elevation={${R.varName}R.elevation as number}`
        : ''
  const jsx =
    `<Card${elevation}${onClick}${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    parts.join('') +
    `</Card>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate }
}

function generateNavbar(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const links = Array.isArray(props.links) ? props.links : []
  const items = links
    .filter((l): l is Record<string, unknown> => Boolean(l) && typeof l === 'object')
    .map((l) => `{ label: ${jsString(l.label ?? '')}, href: ${jsString(l.href ?? '#')} }`)
    .join(', ')
  const linksExpr = R.overridden.has('links')
    ? `{${R.varName}R.links as Array<{ label: string; href: string }}>}`
    : `{[${items}]}`
  const logo = typeof props.logo === 'string' ? ` logo=${ref(R, 'logo', jsString(props.logo), 'string')}` : ''
  const sticky = props.sticky === true ? ' sticky' : ''
  const transparent = props.transparent === true ? ' transparent' : ''
  const jsx =
    `<Navbar${logo} links=${linksExpr}` +
    `${sticky}${transparent}${styleAttr(component, ctx)}${a11yAttrs(component)} />`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

/** Row-format chart data (the canvas `chartLabels`/`datasets` fields) → chart payload. */
function chartDataFromRows(props: Record<string, unknown>): Record<string, unknown> | null {
  const rawLabels = props.chartLabels
  const labels = Array.isArray(rawLabels)
    ? rawLabels.map((l) =>
        typeof l === 'string' ? l : String((l as Record<string, unknown>)?.label ?? '')
      )
    : []
  const rawRows = props.datasets
  if (!Array.isArray(rawRows)) return null
  const datasets = rawRows
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
    .map((row) => {
      const numbers = String(row.values ?? '').match(/-?\d+(?:\.\d+)?/g) ?? []
      const dataset: Record<string, unknown> = { data: numbers.map(Number) }
      if (typeof row.label === 'string' && row.label.trim()) dataset.label = row.label
      if (typeof row.color === 'string' && row.color.trim()) dataset.color = row.color
      return dataset
    })
  return { labels, datasets }
}

function generateChart(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const rawType = String(props.type ?? 'bar')
  const type = ['line', 'bar', 'pie', 'doughnut', 'area'].includes(rawType) ? rawType : 'bar'
  const data =
    props.data && typeof props.data === 'object' ? props.data : chartDataFromRows(props)
  const dataExpr = R.overridden.has('data')
    ? ` data={${R.varName}R.data as never}`
    : data
      ? ` data={${JSON.stringify(data)} as never}`
      : ' data={null}'
  const jsx =
    `<Chart type=${ref(R, 'type', jsString(type), `'line' | 'bar' | 'pie' | 'doughnut' | 'area'`)}${dataExpr}` +
    `${styleAttr(component, ctx)}${a11yAttrs(component)} />`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generateTable(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const columns = Array.isArray(props.columns) ? props.columns : []
  const data = Array.isArray(props.data) ? props.data : []
  const columnsExpr = R.overridden.has('columns')
    ? `{${R.varName}R.columns as Array<{ key: string; label: string }>}`
    : `{${JSON.stringify(columns)} as never}`
  const dataExpr = R.overridden.has('data')
    ? `{${R.varName}R.data as Array<Record<string, unknown>>}`
    : `{${JSON.stringify(data)} as never}`
  const sortable = props.sortable === true ? ' sortable' : ''
  const filterable = props.filterable === true ? ' filterable' : ''
  const jsx =
    `<Table columns=${columnsExpr} data=${dataExpr}` +
    `${sortable}${filterable}${styleAttr(component, ctx)}${a11yAttrs(component)} />`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

/** Fallback for unknown types: JSON comment + nothing rendered. */
function generateUnknown(component: Component): GeneratedComponent {
  const type = String(asComp(component).type ?? 'unknown')
  return {
    hooks: [],
    jsx: `{/* Unsupported component type: ${escText(type)} */}`,
    needsNavigate: false,
  }
}

/**
 * Generate JSX for one schema component (children rendered recursively into
 * cards, as siblings otherwise).
 */
export function generateComponentJSX(
  component: Component,
  ctx: ComponentGenContext,
  varName: string,
  childJSX = ''
): GeneratedComponent {
  const type = String(asComp(component).type ?? '')
  switch (type) {
    case 'Button':
      return generateButton(component, ctx, varName)
    case 'Input':
      return generateInput(component, ctx, varName)
    case 'Card':
      return generateCard(component, ctx, varName, childJSX)
    case 'Navbar':
      return generateNavbar(component, ctx, varName)
    case 'Chart':
      return generateChart(component, ctx, varName)
    case 'Table':
      return generateTable(component, ctx, varName)
    default:
      return generateUnknown(component)
  }
}
