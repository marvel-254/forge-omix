import type { ComponentConfig } from '@measured/puck'
import { resolveTokenRefs } from '../ComponentRenderer'
import { useSchemaStore } from '../../store/schemaStore'
import { useInstancePresentation } from '../presentation'

/**
 * Marketing website sections for the canvas registry.
 *
 * Each config follows the registry discipline (registry.tsx): Puck `fields`
 * describing every prop, canonical `defaultProps` carrying the full prop
 * shape with real marketing copy, and a `render` fn that resolves project
 * design-token `$ref`s and applies instance presentation (visibility, styles,
 * a11y attributes).
 *
 * Renders are defensive on purpose: the library panel and codegen can hand a
 * config partial props, so every string is read through `text()` and every
 * list through `list()` — never assumed to exist.
 */

/** Shared render props: Puck injects `id` and `puck` into every render. */
interface BaseRenderProps extends Record<string, unknown> {
  id: string
  puck: unknown
}

function useResolved<P extends Record<string, unknown>>(props: P): P {
  const tokens = useSchemaStore((s) => s.project?.designTokens)
  return resolveTokenRefs(props, tokens)
}

/** Read a string prop defensively — non-strings render as "absent". */
function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Read a list prop defensively — a missing/malformed list renders as empty. */
function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

/** Responsive column classes derived from a card count. */
function cardGridClass(count: number): string {
  if (count <= 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-1 md:grid-cols-2'
  if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
}

// --- Hero ---

interface HeroRenderProps extends BaseRenderProps {
  eyebrow?: string
  headline?: string
  subheadline?: string
  primaryCta?: string
  secondaryCta?: string
  imageUrl?: string
  align?: 'left' | 'center'
}

const HeroConfig: ComponentConfig = {
  fields: {
    eyebrow: { type: 'text', label: 'Eyebrow' },
    headline: { type: 'text', label: 'Headline' },
    subheadline: { type: 'textarea', label: 'Subheadline' },
    primaryCta: { type: 'text', label: 'Primary CTA' },
    secondaryCta: { type: 'text', label: 'Secondary CTA' },
    imageUrl: { type: 'text', label: 'Image URL' },
    align: {
      type: 'select',
      label: 'Alignment',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
      ],
    },
  },
  defaultProps: {
    eyebrow: 'Now in public beta',
    headline: 'Ship a production website in an afternoon',
    subheadline:
      'Forge turns your brief into a real, responsive site — components, copy, and layout included. No handoff tickets, no rebuild sprint.',
    primaryCta: 'Start building free',
    secondaryCta: 'See how it works',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    align: 'left',
  },
  render: (props: HeroRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const eyebrow = text(resolved.eyebrow)
    const headline = text(resolved.headline)
    const subheadline = text(resolved.subheadline)
    const primaryCta = text(resolved.primaryCta)
    const secondaryCta = text(resolved.secondaryCta)
    const imageUrl = text(resolved.imageUrl)
    const imageAlt = headline ? `${headline} — product preview` : 'Product preview'
    const centered = text(resolved.align) === 'center'
    // A split layout needs an image to sit beside; without one it stacks.
    const split = !centered && Boolean(imageUrl)

    return (
      <section
        style={pres?.style}
        {...(pres?.a11y ?? {})}
        className={`w-full bg-background px-6 py-16 text-foreground md:py-24 ${
          split ? 'grid grid-cols-1 items-center gap-12 md:grid-cols-2' : ''
        }`}
      >
        <div
          className={
            split
              ? 'flex flex-col items-start text-left'
              : 'mx-auto flex max-w-3xl flex-col items-center text-center'
          }
        >
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {headline}
          </h1>
          {subheadline ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {subheadline}
            </p>
          ) : null}
          {primaryCta || secondaryCta ? (
            <div
              className={`mt-10 flex flex-col gap-3 sm:flex-row ${
                centered ? 'sm:justify-center' : 'sm:justify-start'
              }`}
            >
              {primaryCta ? (
                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {primaryCta}
                </a>
              ) : null}
              {secondaryCta ? (
                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-lg border border-border px-8 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {secondaryCta}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className={`h-auto w-full rounded-xl border border-border object-cover ${
              centered ? 'mx-auto mt-14 max-w-4xl' : ''
            }`}
          />
        ) : null}
      </section>
    )
  },
}

// --- Features ---

interface FeatureItem {
  icon: string
  title: string
  description: string
}

interface FeaturesRenderProps extends BaseRenderProps {
  heading?: string
  subheading?: string
  columns?: 2 | 3 | 4
  items?: FeatureItem[]
}

const FEATURE_COLUMNS: Record<number, string> = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

const FeaturesConfig: ComponentConfig = {
  fields: {
    heading: { type: 'text', label: 'Heading' },
    subheading: { type: 'textarea', label: 'Subheading' },
    columns: {
      type: 'select',
      label: 'Columns',
      options: [
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
      ],
    },
    items: {
      type: 'array',
      label: 'Features',
      arrayFields: {
        icon: { type: 'text', label: 'Icon (glyph)' },
        title: { type: 'text', label: 'Title' },
        description: { type: 'textarea', label: 'Description' },
      },
      defaultItemProps: {
        icon: '✦',
        title: 'Feature title',
        description: 'One sentence on what this feature does for the customer.',
      },
      getItemSummary: (item: FeatureItem) => item?.title ?? 'Feature',
    },
  },
  defaultProps: {
    heading: 'Everything you need to launch',
    subheading:
      'The parts of a marketing site that usually take a week, already built and ready to restyle.',
    columns: 3,
    items: [
      {
        icon: '⚡',
        title: 'Instant previews',
        description:
          'Every edit renders on a real canvas with your design tokens applied — no build step between you and the result.',
      },
      {
        icon: '◈',
        title: 'Responsive by default',
        description:
          'Sections declare their own breakpoints, so a layout that looks right on a phone stays right on a desktop.',
      },
      {
        icon: '⌘',
        title: 'Export that compiles',
        description:
          'Export a clean, typed project you can host anywhere. You own the code, not a lock-in export.',
      },
    ],
  },
  render: (props: FeaturesRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const heading = text(resolved.heading)
    const subheading = text(resolved.subheading)
    const columns = resolved.columns === 2 || resolved.columns === 4 ? resolved.columns : 3
    const items = list<FeatureItem>(resolved.items)

    return (
      <section style={pres?.style} {...(pres?.a11y ?? {})} className="w-full bg-background px-6 py-20 text-foreground">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{heading}</h2>
            {subheading ? (
              <p className="mt-4 text-lg text-muted-foreground">{subheading}</p>
            ) : null}
          </div>
          <div className={`mt-14 grid gap-8 ${FEATURE_COLUMNS[columns]}`}>
            {items.map((item, index) => (
              <article
                key={`${text(item?.title)}-${index}`}
                className="flex flex-col rounded-xl border border-border bg-card p-6 text-card-foreground"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-xl text-primary"
                >
                  {text(item?.icon) || '✦'}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{text(item?.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {text(item?.description)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    )
  },
}

// --- Pricing ---

interface PricingTier {
  name: string
  price: string
  period: string
  features: string[]
  highlighted: boolean
  ctaText: string
}

interface PricingRenderProps extends BaseRenderProps {
  heading?: string
  subheading?: string
  tiers?: PricingTier[]
}

const PricingConfig: ComponentConfig = {
  fields: {
    heading: { type: 'text', label: 'Heading' },
    subheading: { type: 'textarea', label: 'Subheading' },
    tiers: {
      type: 'array',
      label: 'Tiers',
      arrayFields: {
        name: { type: 'text', label: 'Name' },
        price: { type: 'text', label: 'Price' },
        period: { type: 'text', label: 'Period' },
        // Puck 0.20 has no string-list field; a newline-delimited textarea keeps
        // the stored prop a `string[]`, matching the exported schema shape.
        features: {
          type: 'textarea',
          label: 'Included features (one per line)',
        },
        // Puck 0.20 has no native boolean field; model it as a Yes/No select.
        highlighted: {
          type: 'select',
          label: 'Most popular',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        ctaText: { type: 'text', label: 'CTA text' },
      },
      defaultItemProps: {
        name: 'Plan',
        price: '$0',
        period: 'per month',
        features: ['Feature one', 'Feature two'],
        highlighted: false,
        ctaText: 'Choose plan',
      },
      getItemSummary: (item: PricingTier) => item?.name ?? 'Tier',
    },
  },
  defaultProps: {
    heading: 'Simple, honest pricing',
    subheading: 'Start free, upgrade when the traffic arrives. Cancel whenever you like.',
    tiers: [
      {
        name: 'Starter',
        price: '$0',
        period: 'per month',
        features: ['1 published site', 'Core section library', 'Community support'],
        highlighted: false,
        ctaText: 'Start free',
      },
      {
        name: 'Growth',
        price: '$29',
        period: 'per month',
        features: [
          'Unlimited sites',
          'Custom design tokens',
          'Code export',
          'Email support',
        ],
        highlighted: true,
        ctaText: 'Start 14-day trial',
      },
      {
        name: 'Scale',
        price: '$99',
        period: 'per month',
        features: ['Everything in Growth', 'Team seats', 'SSO & audit log', 'Priority support'],
        highlighted: false,
        ctaText: 'Talk to sales',
      },
    ],
  },
  render: (props: PricingRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const heading = text(resolved.heading)
    const subheading = text(resolved.subheading)
    const tiers = list<PricingTier>(resolved.tiers)

    return (
      <section style={pres?.style} {...(pres?.a11y ?? {})} className="w-full bg-background px-6 py-20 text-foreground">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{heading}</h2>
            {subheading ? (
              <p className="mt-4 text-lg text-muted-foreground">{subheading}</p>
            ) : null}
          </div>
          <div className={`mt-14 grid items-start gap-8 ${cardGridClass(tiers.length)}`}>
            {tiers.map((tier, index) => {
              const highlighted = Boolean(tier?.highlighted)
              // The editor stores features newline-delimited; a stored array
              // (hand-written schema) is accepted too.
              const rawFeatures: unknown = tier?.features
              const features = (
                Array.isArray(rawFeatures) ? rawFeatures : text(rawFeatures).split('\n')
              )
                .map((feature) => text(feature))
                .filter(Boolean)
              return (
                <article
                  key={`${text(tier?.name)}-${index}`}
                  className={`relative flex flex-col rounded-2xl bg-card p-8 text-card-foreground ${
                    highlighted
                      ? 'border-2 border-primary ring-2 ring-primary'
                      : 'border border-border'
                  }`}
                >
                  {highlighted ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                      Most popular
                    </span>
                  ) : null}
                  <h3 className="text-lg font-semibold">{text(tier?.name)}</h3>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">{text(tier?.price)}</span>
                    {text(tier?.period) ? (
                      <span className="text-sm text-muted-foreground">{text(tier?.period)}</span>
                    ) : null}
                  </p>
                  {features.length ? (
                    <ul className="mt-8 flex flex-col gap-3">
                      {features.map((feature, featureIndex) => (
                        <li key={`${feature}-${featureIndex}`} className="flex items-start gap-3 text-sm">
                          <span aria-hidden="true" className="font-semibold text-primary">
                            ✓
                          </span>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {text(tier?.ctaText) ? (
                    <a
                      href="#"
                      className={`mt-8 inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold ${
                        highlighted
                          ? 'bg-primary text-primary-foreground transition-opacity hover:opacity-90'
                          : 'border border-border text-foreground transition-colors hover:bg-muted'
                      }`}
                    >
                      {text(tier?.ctaText)}
                    </a>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
      </section>
    )
  },
}

// --- Testimonials ---

interface TestimonialItem {
  quote: string
  author: string
  role: string
}

interface TestimonialsRenderProps extends BaseRenderProps {
  heading?: string
  items?: TestimonialItem[]
}

const TestimonialsConfig: ComponentConfig = {
  fields: {
    heading: { type: 'text', label: 'Heading' },
    items: {
      type: 'array',
      label: 'Testimonials',
      arrayFields: {
        quote: { type: 'textarea', label: 'Quote' },
        author: { type: 'text', label: 'Author' },
        role: { type: 'text', label: 'Role' },
      },
      defaultItemProps: {
        quote: 'What did this change for you?',
        author: 'Customer name',
        role: 'Role, Company',
      },
      getItemSummary: (item: TestimonialItem) => item?.author ?? 'Testimonial',
    },
  },
  defaultProps: {
    heading: 'Teams ship faster with Forge',
    items: [
      {
        quote:
          'We replaced a three-week agency brief with an afternoon of our own edits. The exported repo passed our review on the first try.',
        author: 'Priya Raman',
        role: 'Head of Marketing, Northwind',
      },
      {
        quote:
          'The design tokens carry over exactly, so what I approved in the canvas is what production renders. No surprise handoff.',
        author: 'Daniel Okoye',
        role: 'Engineering Lead, Cadence Labs',
      },
      {
        quote:
          'Our marketing site finally matches the product. I stopped writing copy into a CMS and started writing it where the layout lives.',
        author: 'Sofia Marchetti',
        role: 'Founder, Foldwork',
      },
    ],
  },
  render: (props: TestimonialsRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const heading = text(resolved.heading)
    const items = list<TestimonialItem>(resolved.items)

    return (
      <section style={pres?.style} {...(pres?.a11y ?? {})} className="w-full bg-muted px-6 py-20 text-foreground">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">{heading}</h2>
          <div className={`mt-14 grid gap-8 ${cardGridClass(items.length)}`}>
            {items.map((item, index) => {
              const author = text(item?.author)
              return (
                <figure
                  key={`${author}-${index}`}
                  className="flex flex-col rounded-xl border border-border bg-card p-8 text-card-foreground"
                >
                  <blockquote className="flex-1 text-base leading-relaxed">
                    {text(item?.quote)}
                  </blockquote>
                  <figcaption className="mt-6 border-t border-border pt-4">
                    <p className="text-sm font-semibold">{author}</p>
                    {text(item?.role) ? (
                      <p className="mt-1 text-sm text-muted-foreground">{text(item?.role)}</p>
                    ) : null}
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </div>
      </section>
    )
  },
}

// --- Faq ---

interface FaqItem {
  question: string
  answer: string
}

interface FaqRenderProps extends BaseRenderProps {
  heading?: string
  items?: FaqItem[]
}

const FaqConfig: ComponentConfig = {
  fields: {
    heading: { type: 'text', label: 'Heading' },
    items: {
      type: 'array',
      label: 'Questions',
      arrayFields: {
        question: { type: 'text', label: 'Question' },
        answer: { type: 'textarea', label: 'Answer' },
      },
      defaultItemProps: {
        question: 'A question customers keep asking?',
        answer: 'Answer it in two or three sentences so nobody has to email you.',
      },
      getItemSummary: (item: FaqItem) => item?.question ?? 'Question',
    },
  },
  defaultProps: {
    heading: 'Questions, answered',
    items: [
      {
        question: 'Do I own the exported code?',
        answer:
          'Yes. Export produces a plain TypeScript and Tailwind project you can commit, self-host, or hand to your team. There is no runtime dependency on Forge.',
      },
      {
        question: 'Can I change the design tokens later?',
        answer:
          'Tokens are resolved at render time, so editing a colour or radius updates every section that uses it — including the ones already exported.',
      },
      {
        question: 'What happens when I publish?',
        answer:
          'The site is served from a global edge with incremental builds. Only the sections you changed are rebuilt, so publishes stay fast.',
      },
      {
        question: 'Can my designer review changes?',
        answer:
          'Invite reviewers to comment on any section. They can leave notes without needing editor access to your project.',
      },
    ],
  },
  render: (props: FaqRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const heading = text(resolved.heading)
    const items = list<FaqItem>(resolved.items)

    return (
      <section style={pres?.style} {...(pres?.a11y ?? {})} className="w-full bg-background px-6 py-20 text-foreground">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">{heading}</h2>
          <div className="mt-12 flex flex-col gap-4">
            {items.map((item, index) => (
              <details
                key={`${text(item?.question)}-${index}`}
                className="group rounded-lg border border-border bg-card text-card-foreground"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium [&::-webkit-details-marker]:hidden">
                  <span>{text(item?.question)}</span>
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground transition-transform group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {text(item?.answer)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    )
  },
}

// --- CTA banner ---

interface CtaBannerRenderProps extends BaseRenderProps {
  heading?: string
  subheading?: string
  ctaText?: string
  ctaHref?: string
}

const CtaBannerConfig: ComponentConfig = {
  fields: {
    heading: { type: 'text', label: 'Heading' },
    subheading: { type: 'textarea', label: 'Subheading' },
    ctaText: { type: 'text', label: 'CTA text' },
    ctaHref: { type: 'text', label: 'CTA link' },
  },
  defaultProps: {
    heading: 'Ready to launch your next site?',
    subheading:
      'Spin up a project, paste in your brand tokens, and publish before your coffee gets cold.',
    ctaText: 'Create your first site',
    ctaHref: '#',
  },
  render: (props: CtaBannerRenderProps) => {
    const pres = useInstancePresentation(props.id)
    const resolved = useResolved({
      ...(props as unknown as Record<string, unknown>),
      ...(pres?.overrides ?? {}),
    })
    if (pres && !pres.visible) return <></>
    const heading = text(resolved.heading)
    const subheading = text(resolved.subheading)
    const ctaText = text(resolved.ctaText)
    const ctaHref = text(resolved.ctaHref)

    return (
      <section style={pres?.style} {...(pres?.a11y ?? {})} className="w-full bg-primary px-6 py-16 text-primary-foreground md:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{heading}</h2>
          {subheading ? <p className="text-lg opacity-90">{subheading}</p> : null}
          {ctaText ? (
            <a
              href={ctaHref || '#'}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-background px-8 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {ctaText}
            </a>
          ) : null}
        </div>
      </section>
    )
  },
}

export {
  HeroConfig,
  FeaturesConfig,
  PricingConfig,
  TestimonialsConfig,
  FaqConfig,
  CtaBannerConfig,
}