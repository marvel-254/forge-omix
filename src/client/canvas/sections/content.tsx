import type { ComponentConfig } from '@measured/puck'
import { resolveTokenRefs } from '../ComponentRenderer'
import { useSchemaStore } from '../../store/schemaStore'
import { useInstancePresentation } from '../presentation'

/**
 * Content section components for the canvas registry.
 *
 * Footer, Stats, Gallery, ContactForm, Article and LogoCloud — the long-form
 * sections a real marketing site is assembled from. Every render function is a
 * React component, so hooks come first, then the visibility gate, then the
 * presentation style/a11y spread on the outermost element.
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

/** Shared render props: Puck injects `id` and `puck` into every render. */
interface BaseRenderProps extends Record<string, unknown> {
  id: string
  puck: unknown
}

function useDesignTokens() {
  return useSchemaStore((s) => s.project?.designTokens)
}

function useResolved<P extends Record<string, unknown>>(props: P): P {
  const tokens = useDesignTokens()
  return resolveTokenRefs(props, tokens)
}

/**
 * Read a list prop defensively. A schema may hand a render function nothing,
 * a scalar, or a half-typed array — never index into it without this.
 */
function listOf<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback
}

/** Coerce an unknown prop to displayable text. */
function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

/**
 * Responsive grid classes per supported column count, keyed by the `columns`
 * prop. Literal strings only — Tailwind cannot see computed class names.
 */
const GRID_BY_COLUMNS: Record<string, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

// --- Footer ---

interface FooterLink {
  label?: string
  href?: string
}

interface FooterColumn {
  title?: string
  links?: FooterLink[]
}

interface FooterRenderProps extends BaseRenderProps {
  brand?: string
  tagline?: string
  columns?: FooterColumn[]
  copyright?: string
}

const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '#changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Customers', href: '#customers' },
      { label: 'Careers', href: '#careers' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#docs' },
      { label: 'Support', href: '#support' },
      { label: 'Status', href: '#status' },
    ],
  },
]

export const FooterConfig: ComponentConfig = {
  fields: {
    brand: { type: 'text', label: 'Brand' },
    tagline: { type: 'textarea', label: 'Tagline' },
    columns: {
      type: 'array',
      label: 'Link columns',
      arrayFields: {
        title: { type: 'text', label: 'Column title' },
        links: {
          type: 'array',
          label: 'Links',
          arrayFields: {
            label: { type: 'text', label: 'Label' },
            href: { type: 'text', label: 'Href' },
          },
          defaultItemProps: { label: 'Link', href: '#' },
          getItemSummary: (item: FooterLink) => item?.label ?? item?.href ?? 'Link',
        },
      },
      defaultItemProps: {
        title: 'Column',
        links: [
          { label: 'Link', href: '#' },
          { label: 'Link', href: '#' },
        ],
      },
      getItemSummary: (item: FooterColumn) => item?.title ?? 'Column',
    },
    copyright: { type: 'text', label: 'Copyright' },
  },
  defaultProps: {
    brand: 'Northwind',
    tagline:
      'The collaborative workspace for product teams that ship fast — one source of truth for every brief, mock and launch.',
    columns: DEFAULT_FOOTER_COLUMNS,
    copyright: '© 2026 Northwind Labs, Inc. All rights reserved.',
  },
  render: (props: FooterRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const columns = listOf(resolved.columns, DEFAULT_FOOTER_COLUMNS)
    const brand = text(resolved.brand, 'Northwind')
    const tagline = text(resolved.tagline)
    const copyright = text(resolved.copyright)
    return (
      <footer
        style={pres?.style}
        {...(pres?.a11y ?? {})}
        className="border-t border-border bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <p className="text-lg font-semibold tracking-tight">{brand}</p>
              {tagline ? (
                <p className="mt-3 max-w-xs text-sm text-muted-foreground">{tagline}</p>
              ) : null}
            </div>
            {columns.map((column, columnIndex) => {
              const title = text(column?.title, 'Column')
              const links = listOf<FooterLink>(column?.links, [])
              return (
                <nav key={`${title}-${columnIndex}`} aria-label={title}>
                  <h2 className="text-sm font-semibold">{title}</h2>
                  <ul className="mt-3 space-y-2">
                    {links.map((link, linkIndex) => (
                      <li key={`${text(link?.href)}-${linkIndex}`}>
                        <a
                          href={text(link?.href, '#')}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {text(link?.label, 'Link')}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )
            })}
          </div>
          {copyright ? (
            <div className="mt-10 border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">{copyright}</p>
            </div>
          ) : null}
        </div>
      </footer>
    )
  },
}

// --- Stats ---

interface StatItem {
  value?: string
  label?: string
  description?: string
}

interface StatsRenderProps extends BaseRenderProps {
  heading?: string
  items?: StatItem[]
}

const DEFAULT_STATS: StatItem[] = [
  { value: '12k+', label: 'Teams onboard', description: 'Product and design orgs building in Northwind.' },
  { value: '99.99%', label: 'Uptime', description: 'Measured across all regions, last 12 months.' },
  { value: '4.8/5', label: 'Customer rating', description: 'Average across 2,300+ verified reviews.' },
  { value: '38%', label: 'Faster launches', description: 'Median reduction in time from brief to release.' },
]

export const StatsConfig: ComponentConfig = {
  fields: {
    heading: { type: 'text', label: 'Heading' },
    items: {
      type: 'array',
      label: 'Stats',
      arrayFields: {
        value: { type: 'text', label: 'Value' },
        label: { type: 'text', label: 'Label' },
        description: { type: 'textarea', label: 'Description' },
      },
      defaultItemProps: { value: '100%', label: 'Metric', description: 'How it is measured.' },
      getItemSummary: (item: StatItem) => item?.label ?? item?.value ?? 'Metric',
    },
  },
  defaultProps: {
    heading: 'Trusted by teams that ship every day',
    items: DEFAULT_STATS,
  },
  render: (props: StatsRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const items = listOf(resolved.items, DEFAULT_STATS)
    const heading = text(resolved.heading)
    return (
      <section
        style={pres?.style}
        {...(pres?.a11y ?? {})}
        className="bg-muted px-4 py-16 text-foreground sm:px-6 lg:px-8"
      >
        <div className="mx-auto w-full max-w-6xl">
          {heading ? (
            <h2 className="text-center text-3xl font-semibold tracking-tight">{heading}</h2>
          ) : null}
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {items.map((item, index) => (
              <div key={`${text(item?.label)}-${index}`} className="flex flex-col items-center text-center">
                <dt className="order-2 mt-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {text(item?.label, 'Metric')}
                </dt>
                <dd className="order-1 text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
                  {text(item?.value, '—')}
                  {item?.description ? (
                    <span className="mt-3 block text-sm font-normal tracking-normal text-muted-foreground">
                      {text(item?.description)}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    )
  },
}

// --- Gallery ---

interface GalleryImage {
  src?: string
  alt?: string
  caption?: string
}

interface GalleryRenderProps extends BaseRenderProps {
  heading?: string
  columns?: number
  images?: GalleryImage[]
}

const FALLBACK_IMAGE_SRC =
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80'

const DEFAULT_GALLERY: GalleryImage[] = [
  {
    src: FALLBACK_IMAGE_SRC,
    alt: 'Sunlit open-plan office with long shared desks',
    caption: 'Our studio floor in Lisbon, where every Northwind release starts.',
  },
  {
    src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Product team collaborating around a whiteboard',
    caption: 'Weekly roadmap review with the platform squad.',
  },
  {
    src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Engineers pairing at a desk with dual monitors',
    caption: 'Pairing sessions for the rendering and sync engine.',
  },
  {
    src: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Team presentation to a seated audience in a bright room',
    caption: 'Customer council, where the next release gets shaped.',
  },
  {
    src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    alt: 'Small group discussing sticky notes on a glass wall',
    caption: 'Design critique for the new component library.',
  },
  {
    src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    alt: 'Two teammates talking through notes at a round table',
    caption: 'Onboarding week: every new hire ships something in seven days.',
  },
]

export const GalleryConfig: ComponentConfig = {
  fields: {
    heading: { type: 'text', label: 'Heading' },
    columns: {
      type: 'select',
      label: 'Columns',
      options: [
        { label: '2 columns', value: 2 },
        { label: '3 columns', value: 3 },
        { label: '4 columns', value: 4 },
      ],
    },
    images: {
      type: 'array',
      label: 'Images',
      arrayFields: {
        src: { type: 'text', label: 'Image URL' },
        alt: { type: 'text', label: 'Alt text' },
        caption: { type: 'textarea', label: 'Caption' },
      },
      defaultItemProps: { src: FALLBACK_IMAGE_SRC, alt: 'Descriptive alt text', caption: 'Caption' },
      getItemSummary: (item: GalleryImage) => item?.alt ?? item?.caption ?? 'Image',
    },
  },
  defaultProps: {
    heading: 'Life at Northwind',
    columns: 3,
    images: DEFAULT_GALLERY,
  },
  render: (props: GalleryRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const images = listOf(resolved.images, DEFAULT_GALLERY)
    const heading = text(resolved.heading)
    const gridClass = GRID_BY_COLUMNS[String(resolved.columns)] ?? GRID_BY_COLUMNS['3']
    return (
      <section
        style={pres?.style}
        {...(pres?.a11y ?? {})}
        className="bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8"
      >
        <div className="mx-auto w-full max-w-6xl">
          {heading ? (
            <h2 className="text-3xl font-semibold tracking-tight">{heading}</h2>
          ) : null}
          <div className={`mt-10 grid gap-6 ${gridClass}`}>
            {images.map((image, index) => {
              const caption = text(image?.caption)
              return (
                <figure
                  key={`${text(image?.alt)}-${index}`}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  <img
                    src={text(image?.src, FALLBACK_IMAGE_SRC)}
                    alt={text(image?.alt, 'Project photo')}
                    loading="lazy"
                    className="h-56 w-full object-cover"
                  />
                  {caption ? (
                    <figcaption className="px-4 py-3 text-sm text-muted-foreground">{caption}</figcaption>
                  ) : null}
                </figure>
              )
            })}
          </div>
        </div>
      </section>
    )
  },
}

// --- ContactForm ---

interface ContactField {
  name?: string
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
}

interface ContactFormRenderProps extends BaseRenderProps {
  heading?: string
  subheading?: string
  fields?: ContactField[]
  submitText?: string
}

/** HTML input types the form renders; anything else falls back to `text`. */
const CONTACT_FIELD_TYPES: Record<string, true> = {
  text: true,
  email: true,
  tel: true,
  url: true,
  number: true,
  search: true,
}

const DEFAULT_CONTACT_FIELDS: ContactField[] = [
  {
    name: 'name',
    label: 'Full name',
    type: 'text',
    placeholder: 'Ada Lovelace',
    required: true,
  },
  {
    name: 'email',
    label: 'Work email',
    type: 'email',
    placeholder: 'ada@company.com',
    required: true,
  },
  {
    name: 'company',
    label: 'Company',
    type: 'text',
    placeholder: 'Company name',
    required: false,
  },
  {
    name: 'phone',
    label: 'Phone number',
    type: 'tel',
    placeholder: '+1 555 0100',
    required: false,
  },
]

export const ContactFormConfig: ComponentConfig = {
  fields: {
    heading: { type: 'text', label: 'Heading' },
    subheading: { type: 'textarea', label: 'Subheading' },
    fields: {
      type: 'array',
      label: 'Fields',
      arrayFields: {
        name: { type: 'text', label: 'Name (form key)' },
        label: { type: 'text', label: 'Label' },
        type: {
          type: 'select',
          label: 'Type',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Telephone', value: 'tel' },
            { label: 'URL', value: 'url' },
            { label: 'Number', value: 'number' },
            { label: 'Search', value: 'search' },
          ],
        },
        placeholder: { type: 'text', label: 'Placeholder' },
        required: boolField('Required'),
      },
      defaultItemProps: {
        name: 'field',
        label: 'Field label',
        type: 'text',
        placeholder: 'Placeholder',
        required: false,
      },
      getItemSummary: (item: ContactField) => item?.label ?? item?.name ?? 'Field',
    },
    submitText: { type: 'text', label: 'Submit button text' },
  },
  defaultProps: {
    heading: 'Talk to our team',
    subheading:
      'Tell us what you are building and we will get back within one business day with a plan and pricing.',
    fields: DEFAULT_CONTACT_FIELDS,
    submitText: 'Send message',
  },
  render: (props: ContactFormRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const fields = listOf(resolved.fields, DEFAULT_CONTACT_FIELDS)
    const heading = text(resolved.heading)
    const subheading = text(resolved.subheading)
    return (
      <section
        style={pres?.style}
        {...(pres?.a11y ?? {})}
        className="bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8"
      >
        <div className="mx-auto w-full max-w-2xl">
          {heading ? (
            <h2 className="text-3xl font-semibold tracking-tight">{heading}</h2>
          ) : null}
          {subheading ? (
            <p className="mt-3 text-base text-muted-foreground">{subheading}</p>
          ) : null}
          <form className="mt-10 space-y-6" onSubmit={(event: React.FormEvent<HTMLFormElement>) => event.preventDefault()}>
            {fields.map((field, index) => {
              const name = text(field?.name) || `field-${index}`
              const label = text(field?.label, 'Field')
              const declaredType = text(field?.type, 'text')
              return (
                <div key={`${name}-${index}`} className="space-y-2">
                  <label htmlFor={name} className="block text-sm font-medium">
                    {label}
                  </label>
                  <input
                    id={name}
                    name={name}
                    type={CONTACT_FIELD_TYPES[declaredType] ? declaredType : 'text'}
                    placeholder={text(field?.placeholder)}
                    required={Boolean(field?.required)}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              )
            })}
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
            >
              {text(resolved.submitText, 'Submit')}
            </button>
          </form>
        </div>
      </section>
    )
  },
}

// --- Article ---

interface ArticleRenderProps extends BaseRenderProps {
  heading?: string
  body?: string
  author?: string
  publishedAt?: string
}

/** A blank line separates paragraphs in the `body` textarea. */
const PARAGRAPH_BREAK = /\n\s*\n/

/** Display format for `publishedAt`; fixed locale + UTC keeps output stable. */
const LONG_DATE = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' } as const

export const ArticleConfig: ComponentConfig = {
  fields: {
    heading: { type: 'text', label: 'Heading' },
    body: { type: 'textarea', label: 'Body' },
    author: { type: 'text', label: 'Author' },
    publishedAt: { type: 'text', label: 'Published at' },
  },
  defaultProps: {
    heading: 'How Northwind keeps design and code in the same place',
    body:
      'Every product team we work with starts with the same problem: the brief lives in a doc, the mock lives in a design tool, and the shipped interface lives in a repository. By the time the three agree, a quarter has gone by.\n\nNorthwind treats the interface as the shared source of truth. Designers describe components once, engineers consume the same contract, and every change is reviewed in the same place the change will ship.\n\nThe result is boring in the best way: fewer handoffs, shorter review cycles, and a changelog that writes itself as work lands.',
    author: 'Ada Lovelace',
    publishedAt: '2026-02-18',
  },
  render: (props: ArticleRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const heading = text(resolved.heading)
    const paragraphs = text(resolved.body)
      .split(PARAGRAPH_BREAK)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)
    const author = text(resolved.author)
    const publishedRaw = text(resolved.publishedAt)
    const publishedDate = new Date(publishedRaw)
    const publishedIso = Number.isNaN(publishedDate.getTime())
      ? undefined
      : publishedDate.toISOString()
    const publishedLabel = Number.isNaN(publishedDate.getTime())
      ? publishedRaw
      : publishedDate.toLocaleDateString('en-US', LONG_DATE)
    return (
      <article
        style={pres?.style}
        {...(pres?.a11y ?? {})}
        className="bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8"
      >
        <div className="mx-auto w-full max-w-3xl">
          <header className="border-b border-border pb-6">
            {heading ? (
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{heading}</h2>
            ) : null}
            {author || publishedRaw ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {author ? <span className="font-medium text-foreground">{author}</span> : null}
                {author && publishedRaw ? <span aria-hidden="true"> · </span> : null}
                {publishedRaw ? (
                  <time dateTime={publishedIso}>{publishedLabel}</time>
                ) : null}
              </p>
            ) : null}
          </header>
          <div className="mt-8 space-y-5 text-base leading-7 text-muted-foreground">
            {paragraphs.map((paragraph, index) => (
              <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    )
  },
}

// --- LogoCloud ---

interface LogoItem {
  name?: string
  src?: string
}

interface LogoCloudRenderProps extends BaseRenderProps {
  heading?: string
  logos?: LogoItem[]
}

const FALLBACK_LOGO_SRC = 'https://cdn.simpleicons.org/github'

const DEFAULT_LOGOS: LogoItem[] = [
  { name: 'Vercel', src: 'https://cdn.simpleicons.org/vercel' },
  { name: 'GitHub', src: FALLBACK_LOGO_SRC },
  { name: 'Figma', src: 'https://cdn.simpleicons.org/figma' },
  { name: 'Notion', src: 'https://cdn.simpleicons.org/notion' },
  { name: 'Slack', src: 'https://cdn.simpleicons.org/slack' },
  { name: 'Dropbox', src: 'https://cdn.simpleicons.org/dropbox' },
]

export const LogoCloudConfig: ComponentConfig = {
  fields: {
    heading: { type: 'text', label: 'Heading' },
    logos: {
      type: 'array',
      label: 'Logos',
      arrayFields: {
        name: { type: 'text', label: 'Name' },
        src: { type: 'text', label: 'Logo URL' },
      },
      defaultItemProps: { name: 'Company', src: FALLBACK_LOGO_SRC },
      getItemSummary: (item: LogoItem) => item?.name ?? item?.src ?? 'Logo',
    },
  },
  defaultProps: {
    heading: 'Powering launches at',
    logos: DEFAULT_LOGOS,
  },
  render: (props: LogoCloudRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const logos = listOf(resolved.logos, DEFAULT_LOGOS)
    const heading = text(resolved.heading)
    return (
      <section
        style={pres?.style}
        {...(pres?.a11y ?? {})}
        className="border-y border-border bg-card px-4 py-12 text-card-foreground sm:px-6 lg:px-8"
      >
        <div className="mx-auto w-full max-w-6xl">
          {heading ? (
            <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {heading}
            </h2>
          ) : null}
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {logos.map((logo, index) => (
              <li key={`${text(logo?.name)}-${index}`}>
                <img
                  src={text(logo?.src, FALLBACK_LOGO_SRC)}
                  alt={text(logo?.name, 'Customer logo')}
                  loading="lazy"
                  className="h-8 w-auto opacity-70 grayscale transition hover:opacity-100 dark:invert"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  },
}
