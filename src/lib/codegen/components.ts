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

/** Array prop → plain records carrying only `fields`, coerced to strings. */
function stringRecords(value: unknown, fields: string[]): Array<Record<string, string>> {
  const list = Array.isArray(value) ? value : []
  const records: Array<Record<string, string>> = []
  for (const entry of list) {
    const source = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {}
    const record: Record<string, string> = {}
    for (const field of fields) record[field] = String(source[field] ?? '')
    records.push(record)
  }
  return records
}

/** Nested `{ label, href }` link list (footer columns). */
function linkRecords(value: unknown): Array<{ label: string; href: string }> {
  return stringRecords(value, ['label', 'href']).map((link) => ({
    label: link.label,
    href: link.href || '#',
  }))
}

/** String list that also accepts newline-delimited text (pricing features). */
function featureList(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.map((entry) => String(entry ?? ''))
    : typeof value === 'string'
      ? value.split('\n').map((entry) => entry.trim())
      : []
  return raw.filter((entry) => entry.trim() !== '')
}

/** Inline `as Array<T>` source for a prop, honouring responsive overrides. */
function arrayExpr(R: RespCtx, key: string, literal: unknown, elementType: string): string {
  return R.overridden.has(key)
    ? `(${R.varName}R.${key} as Array<${elementType}>)`
    : `(${JSON.stringify(literal)} as Array<${elementType}>)`
}

/** JSX text for one scalar prop: hook value when overridden, escaped copy otherwise. */
function scalarText(R: RespCtx, key: string, fallback: unknown): string {
  return R.overridden.has(key) ? `{${R.varName}R.${key} as string}` : escText(fallback ?? '')
}

/** Parenthesised JS expression for a scalar prop (usable inside `method()` calls). */
function scalarExpr(R: RespCtx, key: string, fallback: unknown): string {
  return R.overridden.has(key) ? `(${R.varName}R.${key} as string)` : jsString(fallback ?? '')
}

/** Anchor target for a CTA: the navigate interaction target, else `#`. */
function ctaHref(component: Component): string {
  const interactions = asComp(component).interactions as Record<string, unknown> | undefined
  const onClick = interactions?.onClick as { type?: string; target?: string } | undefined
  return onClick?.type === 'navigate' && typeof onClick.target === 'string' && onClick.target
    ? onClick.target
    : '#'
}

const COLUMN_COUNTS = [2, 3, 4]

function columnCount(value: unknown): number {
  const n = Number(value)
  return COLUMN_COUNTS.includes(n) ? n : 3
}

/**
 * `className` for a responsive column count. Every literal column class stays
 * in the generated source so Tailwind's scanner can see them.
 */
function gridClassExpr(R: RespCtx, key: string, value: unknown, prefix: string): string {
  const classes = (n: number): string =>
    `${prefix} grid gap-8 sm:grid-cols-1 md:grid-cols-${n}`
  if (!R.overridden.has(key)) return `"${classes(columnCount(value))}"`
  const override = `(${R.varName}R.${key} as number)`
  return `{${override} === 2 ? '${classes(2)}' : ${override} === 4 ? '${classes(4)}' : '${classes(3)}'}`
}

const SECTION_PADDING = 'px-6 py-16 sm:px-8 lg:py-24'
const SECTION_TITLE = 'text-3xl font-bold tracking-tight text-foreground'
const SECTION_SUBTITLE = 'mt-4 max-w-2xl text-lg text-muted-foreground'
const SECTION_CARD = 'rounded-lg border border-border bg-card p-6 text-card-foreground'
const CTA_PRIMARY =
  'inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90'
const CTA_SECONDARY =
  'inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted'

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

function generateHero(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const href = ctaHref(component)
  const center = props.align === 'center'
  const alignClass = R.overridden.has('align')
    ? `{(${R.varName}R.align as string) === 'center' ? 'text-center' : 'text-left'}`
    : `"text-${center ? 'center' : 'left'}"`
  const imageUrl = typeof props.imageUrl === 'string' ? props.imageUrl : ''
  const image = imageUrl
    ? `<img src=${ref(R, 'imageUrl', jsString(imageUrl), 'string')} alt="Product preview" className="w-full rounded-xl border border-border object-cover" />`
    : ''
  const jsx =
    `<section className="bg-background ${SECTION_PADDING}"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">` +
    `<div className=${alignClass}>` +
    `<p className="text-sm font-semibold uppercase tracking-wide text-primary">${scalarText(R, 'eyebrow', props.eyebrow)}</p>` +
    `<h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">${scalarText(R, 'headline', props.headline)}</h1>` +
    `<p className="mt-4 text-lg text-muted-foreground">${scalarText(R, 'subheadline', props.subheadline)}</p>` +
    `<div className="mt-8 flex flex-wrap gap-4">` +
    `<a href=${jsString(href)} className="${CTA_PRIMARY}">${scalarText(R, 'primaryCta', props.primaryCta)}</a>` +
    `<a href="#features" className="${CTA_SECONDARY}">${scalarText(R, 'secondaryCta', props.secondaryCta)}</a>` +
    `</div></div>` +
    `<div className="flex-1">${image}</div>` +
    `</div></section>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generateFeatures(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const items = arrayExpr(
    R,
    'items',
    stringRecords(props.items, ['icon', 'title', 'description']),
    '{ icon: string; title: string; description: string }'
  )
  const jsx =
    `<section id="features" className="bg-background ${SECTION_PADDING}"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto max-w-6xl">` +
    `<h2 className="${SECTION_TITLE}">${scalarText(R, 'heading', props.heading)}</h2>` +
    `<p className="${SECTION_SUBTITLE}">${scalarText(R, 'subheading', props.subheading)}</p>` +
    `<div className=${gridClassExpr(R, 'columns', props.columns, 'mt-12')}>` +
    `{${items}.map((item) => (` +
    `<article key={item.title} className="${SECTION_CARD}">` +
    `<span className="text-2xl" aria-hidden="true">{item.icon}</span>` +
    `<h3 className="mt-4 text-lg font-semibold">{item.title}</h3>` +
    `<p className="mt-2 text-sm text-muted-foreground">{item.description}</p>` +
    `</article>` +
    `))}` +
    `</div></div></section>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generatePricing(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const href = ctaHref(component)
  const tiers = Array.isArray(props.tiers) ? props.tiers : []
  const tierRecords = tiers.map((tier) => {
    const record = tier && typeof tier === 'object' ? (tier as Record<string, unknown>) : {}
    return {
      name: String(record.name ?? ''),
      price: String(record.price ?? ''),
      period: String(record.period ?? ''),
      features: featureList(record.features),
      highlighted: record.highlighted === true,
      ctaText: String(record.ctaText ?? ''),
    }
  })
  const tierType =
    '{ name: string; price: string; period: string; features: string[]; highlighted: boolean; ctaText: string }'
  const tiersExpr = arrayExpr(R, 'tiers', tierRecords, tierType)
  const jsx =
    `<section className="bg-background ${SECTION_PADDING}"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto max-w-6xl">` +
    `<h2 className="text-center ${SECTION_TITLE}">${scalarText(R, 'heading', props.heading)}</h2>` +
    `<p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">${scalarText(R, 'subheading', props.subheading)}</p>` +
    `<div className="mt-12 grid gap-8 sm:grid-cols-1 md:grid-cols-3">` +
    `{${tiersExpr}.map((tier) => (` +
    `<article key={tier.name} className={\`flex flex-col rounded-xl border p-8 \${tier.highlighted ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-card-foreground'}\`}>` +
    `<h3 className="text-xl font-semibold">{tier.name}</h3>` +
    `<p className="mt-4 text-4xl font-bold">{tier.price}` +
    `<span className="ml-1 text-base font-normal text-muted-foreground">{tier.period}</span></p>` +
    `<ul className="mt-6 flex-1 space-y-2 text-sm">` +
    `{tier.features.map((feature) => (<li key={feature} className="flex gap-2">` +
    `<span aria-hidden="true">✓</span><span>{feature}</span></li>))}` +
    `</ul>` +
    `<a href=${jsString(href)} className={\`mt-8 \${tier.highlighted ? '${CTA_PRIMARY}' : '${CTA_SECONDARY}'}\`}>{tier.ctaText}</a>` +
    `</article>` +
    `))}` +
    `</div></div></section>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generateTestimonials(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const items = arrayExpr(
    R,
    'items',
    stringRecords(props.items, ['quote', 'author', 'role']),
    '{ quote: string; author: string; role: string }'
  )
  const jsx =
    `<section className="bg-muted ${SECTION_PADDING}"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto max-w-6xl">` +
    `<h2 className="text-center ${SECTION_TITLE}">${scalarText(R, 'heading', props.heading)}</h2>` +
    `<div className="mt-12 grid gap-6 sm:grid-cols-1 md:grid-cols-3">` +
    `{${items}.map((item) => (` +
    `<figure key={item.author} className="${SECTION_CARD}">` +
    `<blockquote className="text-base text-muted-foreground">“{item.quote}”</blockquote>` +
    `<figcaption className="mt-6">` +
    `<span className="block font-semibold text-foreground">{item.author}</span>` +
    `<span className="block text-sm text-muted-foreground">{item.role}</span>` +
    `</figcaption></figure>` +
    `))}` +
    `</div></div></section>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generateFaq(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const items = arrayExpr(
    R,
    'items',
    stringRecords(props.items, ['question', 'answer']),
    '{ question: string; answer: string }'
  )
  const jsx =
    `<section className="bg-background ${SECTION_PADDING}"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto max-w-3xl">` +
    `<h2 className="${SECTION_TITLE}">${scalarText(R, 'heading', props.heading)}</h2>` +
    `<div className="mt-10 divide-y divide-border rounded-xl border border-border bg-card">` +
    `{${items}.map((item) => (` +
    `<details key={item.question} className="group p-5">` +
    `<summary className="cursor-pointer list-none text-left font-medium text-card-foreground">{item.question}</summary>` +
    `<p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>` +
    `</details>` +
    `))}` +
    `</div></div></section>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generateCtaBanner(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const href = ctaHref(component)
  const jsx =
    `<section className="bg-primary ${SECTION_PADDING}"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto max-w-3xl text-center">` +
    `<h2 className="text-3xl font-bold tracking-tight text-primary-foreground">${scalarText(R, 'heading', props.heading)}</h2>` +
    `<p className="mt-4 text-lg text-primary-foreground/80">${scalarText(R, 'subheading', props.subheading)}</p>` +
    `<a href=${ref(R, 'ctaHref', jsString(typeof props.ctaHref === 'string' && props.ctaHref ? props.ctaHref : href), 'string')} className="${CTA_PRIMARY} mt-8">${scalarText(R, 'ctaText', props.ctaText)}</a>` +
    `</div></section>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generateFooter(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const columns = Array.isArray(props.columns) ? props.columns : []
  const columnRecords = columns.map((column) => {
    const record = column && typeof column === 'object' ? (column as Record<string, unknown>) : {}
    return { title: String(record.title ?? ''), links: linkRecords(record.links) }
  })
  const columnsExpr = arrayExpr(
    R,
    'columns',
    columnRecords,
    '{ title: string; links: Array<{ label: string; href: string }> }'
  )
  const jsx =
    `<footer className="border-t border-border bg-background ${SECTION_PADDING}"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto max-w-6xl">` +
    `<div className="flex flex-col gap-10 md:flex-row md:justify-between">` +
    `<div className="max-w-xs">` +
    `<p className="text-lg font-semibold text-foreground">${scalarText(R, 'brand', props.brand)}</p>` +
    `<p className="mt-2 text-sm text-muted-foreground">${scalarText(R, 'tagline', props.tagline)}</p>` +
    `</div>` +
    `<div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">` +
    `{${columnsExpr}.map((column) => (` +
    `<div key={column.title}>` +
    `<h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{column.title}</h3>` +
    `<ul className="mt-4 space-y-2">` +
    `{column.links.map((link) => (` +
    `<li key={link.href + link.label}><a href={link.href} className="text-sm text-muted-foreground hover:text-foreground">{link.label}</a></li>` +
    `))}` +
    `</ul></div>` +
    `))}` +
    `</div></div>` +
    `<p className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">${scalarText(R, 'copyright', props.copyright)}</p>` +
    `</div></footer>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generateStats(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const items = arrayExpr(
    R,
    'items',
    stringRecords(props.items, ['value', 'label', 'description']),
    '{ value: string; label: string; description: string }'
  )
  const jsx =
    `<section className="bg-muted ${SECTION_PADDING}"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto max-w-6xl">` +
    `<h2 className="text-center ${SECTION_TITLE}">${scalarText(R, 'heading', props.heading)}</h2>` +
    `<dl className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4">` +
    `{${items}.map((item) => (` +
    `<div key={item.label} className="text-center">` +
    `<dd className="text-4xl font-bold text-primary">{item.value}</dd>` +
    `<dt className="mt-2 text-sm font-medium text-foreground">{item.label}</dt>` +
    `<p className="mt-1 text-sm text-muted-foreground">{item.description}</p>` +
    `</div>` +
    `))}` +
    `</dl></div></section>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generateGallery(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const images = Array.isArray(props.images) ? props.images : []
  const imageRecords = images.map((image) => {
    const record = image && typeof image === 'object' ? (image as Record<string, unknown>) : {}
    return {
      src: String(record.src ?? ''),
      alt: String(record.alt ?? ''),
      caption: String(record.caption ?? ''),
    }
  })
  const imagesExpr = arrayExpr(
    R,
    'images',
    imageRecords,
    '{ src: string; alt: string; caption: string }'
  )
  const jsx =
    `<section className="bg-background ${SECTION_PADDING}"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto max-w-6xl">` +
    `<h2 className="text-center ${SECTION_TITLE}">${scalarText(R, 'heading', props.heading)}</h2>` +
    `<div className=${gridClassExpr(R, 'columns', props.columns, 'mt-12')}>` +
    `{${imagesExpr}.map((image) => (` +
    `<figure key={image.src} className="overflow-hidden rounded-xl border border-border bg-card">` +
    `<img src={image.src} alt={image.alt} className="h-64 w-full object-cover" />` +
    `<figcaption className="px-4 py-3 text-sm text-muted-foreground">{image.caption}</figcaption>` +
    `</figure>` +
    `))}` +
    `</div></div></section>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generateContactForm(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  // Wired to the button rather than the form: a native submit would reload the
  // exported page after the fetch/navigate handler runs.
  const { attr: onClick, needsNavigate } = interactionHandler(component, 'onClick')
  const fields = Array.isArray(props.fields) ? props.fields : []
  const fieldRecords = fields.map((field) => {
    const record = field && typeof field === 'object' ? (field as Record<string, unknown>) : {}
    const type = String(record.type ?? 'text')
    return {
      name: String(record.name ?? ''),
      label: String(record.label ?? ''),
      type: type === 'email' || type === 'tel' || type === 'number' ? type : 'text',
      placeholder: String(record.placeholder ?? ''),
      required: record.required === true,
    }
  })
  const fieldsExpr = arrayExpr(
    R,
    'fields',
    fieldRecords,
    '{ name: string; label: string; type: string; placeholder: string; required: boolean }'
  )
  const jsx =
    `<section className="bg-background ${SECTION_PADDING}"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto max-w-2xl">` +
    `<h2 className="${SECTION_TITLE}">${scalarText(R, 'heading', props.heading)}</h2>` +
    `<p className="${SECTION_SUBTITLE}">${scalarText(R, 'subheading', props.subheading)}</p>` +
    `<form className="mt-10 space-y-6">` +
    `{${fieldsExpr}.map((field) => (` +
    `<div key={field.name}>` +
    `<label htmlFor={field.name} className="block text-sm font-medium text-foreground">{field.label}</label>` +
    `<input id={field.name} name={field.name} type={field.type} placeholder={field.placeholder} required={field.required} ` +
    `className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-card-foreground" />` +
    `</div>` +
    `))}` +
    `<button type="button"${onClick} className="${CTA_PRIMARY}">${scalarText(R, 'submitText', props.submitText)}</button>` +
    `</form></div></section>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate }
}

function generateArticle(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const byline = [String(props.author ?? ''), String(props.publishedAt ?? '')]
    .filter((part) => part !== '')
    .join(' · ')
  const jsx =
    `<article className="bg-background ${SECTION_PADDING}"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto max-w-3xl">` +
    `<h1 className="${SECTION_TITLE}">${scalarText(R, 'heading', props.heading)}</h1>` +
    (byline ? `<p className="mt-3 text-sm text-muted-foreground">${escText(byline)}</p>` : '') +
    `<div className="mt-8 space-y-4 leading-7 text-foreground">` +
    `{${scalarExpr(R, 'body', props.body)}.split('\\n').map((paragraph, index) => (` +
    `<p key={index}>{paragraph}</p>` +
    `))}` +
    `</div></div></article>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

function generateLogoCloud(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const logos = Array.isArray(props.logos) ? props.logos : []
  const logoRecords = logos.map((logo) => {
    const record = logo && typeof logo === 'object' ? (logo as Record<string, unknown>) : {}
    return { name: String(record.name ?? ''), src: String(record.src ?? '') }
  })
  const logosExpr = arrayExpr(R, 'logos', logoRecords, '{ name: string; src: string }')
  const jsx =
    `<section className="bg-background py-12"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    `<div className="mx-auto max-w-6xl px-6">` +
    `<h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">${scalarText(R, 'heading', props.heading)}</h2>` +
    `<ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">` +
    `{${logosExpr}.map((logo) => (` +
    `<li key={logo.src}><img src={logo.src} alt={logo.name} className="h-9 w-auto opacity-80" /></li>` +
    `))}` +
    `</ul></div></section>`
  return { hooks: R.hooks, jsx: maybeHidden(R, jsx), needsNavigate: false }
}

const MEDIA_FITS = ['cover', 'contain', 'fill', 'none']
const MEDIA_ROTATIONS = [0, 90, 180, 270]

/** Record view of a nested prop; `{}` for anything that is not a plain object. */
function objectProp(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** Finite number clamped to `min`..`max`; `fallback` for missing/garbage input. */
function numberProp(value: unknown, min: number, max: number, fallback: number): number {
  let parsed: number
  if (typeof value === 'number') parsed = value
  else if (typeof value === 'string' && value.trim() !== '') parsed = Number(value)
  else return fallback
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

/** `edit.filters` → CSS `filter` value; `''` when every control is at default. */
function mediaFilter(edit: Record<string, unknown>): string {
  const filters = objectProp(edit.filters)
  const parts: string[] = []
  const brightness = numberProp(filters.brightness, 0, 200, 100)
  if (brightness !== 100) parts.push(`brightness(${brightness}%)`)
  const contrast = numberProp(filters.contrast, 0, 200, 100)
  if (contrast !== 100) parts.push(`contrast(${contrast}%)`)
  const saturate = numberProp(filters.saturate, 0, 200, 100)
  if (saturate !== 100) parts.push(`saturate(${saturate}%)`)
  const blur = numberProp(filters.blur, 0, 100, 0)
  if (blur !== 0) parts.push(`blur(${blur}px)`)
  const grayscale = numberProp(filters.grayscale, 0, 100, 0)
  if (grayscale !== 0) parts.push(`grayscale(${grayscale}%)`)
  return parts.join(' ')
}

/** `edit` rotation/flip/crop → CSS `transform` value; `''` when nothing is set. */
function mediaTransform(edit: Record<string, unknown>): string {
  const rotation = numberProp(edit.rotation, 0, 270, 0)
  const flip = objectProp(edit.flip)
  const scale = numberProp(objectProp(edit.crop).scale, 1, 100, 1)
  const parts: string[] = []
  if (rotation !== 0 && MEDIA_ROTATIONS.includes(rotation)) parts.push(`rotate(${rotation}deg)`)
  if (scale !== 1) parts.push(`scale(${scale})`)
  if (flip.horizontal === true) parts.push('scaleX(-1)')
  if (flip.vertical === true) parts.push('scaleY(-1)')
  return parts.join(' ')
}

/** `<video>` playback attributes from `videoOptions`; autoplay forces muted. */
function videoAttrs(options: Record<string, unknown>): string {
  const autoplay = options.autoplay === true
  const attrs: string[] = []
  // a11y: a video is only left uncontrollable while it is muted and autoplaying
  if (options.controls === true || !autoplay) attrs.push(' controls')
  if (options.loop === true) attrs.push(' loop')
  if (autoplay) attrs.push(' autoPlay')
  if (options.muted === true || autoplay) attrs.push(' muted')
  if (typeof options.poster === 'string' && options.poster) {
    attrs.push(` poster="${escAttr(options.poster)}"`)
  }
  return attrs.join('')
}

/**
 * Media block (docs/17): one image, GIF, or video asset. The canvas edit state
 * is baked into inline `filter`/`transform` style — nothing that would be a
 * no-op is emitted, so an untouched asset stays free of style noise.
 */
function generateMedia(
  component: Component,
  ctx: ComponentGenContext,
  varName: string
): GeneratedComponent {
  const props = propsOf(component)
  const R = setupResponsive(varName, props, responsiveMaps(component))
  const src = typeof props.src === 'string' ? props.src : ''
  const alt = typeof props.alt === 'string' ? props.alt : ''
  const caption = props.caption
  const fit = MEDIA_FITS.includes(String(props.fit)) ? String(props.fit) : 'cover'

  const styleEntries = [
    `objectFit: ${
      R.overridden.has('fit')
        ? `(${R.varName}R.fit as 'cover' | 'contain' | 'fill' | 'none')`
        : JSON.stringify(fit)
    }`,
  ]
  const edit = objectProp(props.edit)
  const filter = mediaFilter(edit)
  if (filter) styleEntries.push(`filter: ${JSON.stringify(filter)}`)
  const transform = mediaTransform(edit)
  if (transform) styleEntries.push(`transform: ${JSON.stringify(transform)}`)
  const style = ` style={{ ${styleEntries.join(', ')} }}`
  // JSX attribute literals are not JS strings: `"` ends the attribute, so the
  // value must be entity-escaped rather than backslash-escaped.
  const srcAttr = ref(R, 'src', `"${escAttr(src)}"`, 'string')
  const altAttr = ref(R, 'alt', `"${escAttr(alt)}"`, 'string')

  const media = src
    ? props.mediaType === 'video'
      ? `<video${videoAttrs(objectProp(props.videoOptions))} className="h-full w-full"${style}>` +
        `<source src=${srcAttr} type="video/mp4" /></video>`
      : `<img src=${srcAttr} alt=${altAttr} className="h-full w-full"${style} />`
    : `<div className="h-64 w-full bg-muted" />`

  const figcaption =
    caption || R.overridden.has('caption')
      ? `<figcaption className="px-4 py-3 text-sm text-muted-foreground">${scalarText(R, 'caption', caption)}</figcaption>`
      : ''

  const jsx =
    `<figure className="w-full overflow-hidden rounded-xl border border-border bg-card"${styleAttr(component, ctx)}${a11yAttrs(component)}>` +
    media +
    figcaption +
    `</figure>`
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
    case 'Hero':
      return generateHero(component, ctx, varName)
    case 'Features':
      return generateFeatures(component, ctx, varName)
    case 'Pricing':
      return generatePricing(component, ctx, varName)
    case 'Testimonials':
      return generateTestimonials(component, ctx, varName)
    case 'Faq':
      return generateFaq(component, ctx, varName)
    case 'CtaBanner':
      return generateCtaBanner(component, ctx, varName)
    case 'Footer':
      return generateFooter(component, ctx, varName)
    case 'Stats':
      return generateStats(component, ctx, varName)
    case 'Gallery':
      return generateGallery(component, ctx, varName)
    case 'ContactForm':
      return generateContactForm(component, ctx, varName)
    case 'Article':
      return generateArticle(component, ctx, varName)
    case 'LogoCloud':
      return generateLogoCloud(component, ctx, varName)
    case 'Media':
      return generateMedia(component, ctx, varName)
    default:
      return generateUnknown(component)
  }
}
