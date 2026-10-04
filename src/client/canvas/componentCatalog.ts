/**
 * Component catalog: display metadata for every canvas-registered component
 * type (docs/05 §5.5 registration, §4.7 library panel).
 *
 * Single source of truth for the library panel (grouping, search, preview
 * labels) and must stay in key-sync with `canvasRegistry` (registry.tsx) —
 * enforced by tests/unit/componentCatalog.test.ts.
 */

export type ComponentCategory =
  | 'basic'
  | 'navigation'
  | 'dashboard'
  | 'sections'
  | 'marketing'
  | 'content'
  | 'forms'

export interface ComponentMeta {
  /** Schema component type; must match a key of canvasRegistry. */
  type: string
  category: ComponentCategory
  /** Short human-readable label used in the library and panels. */
  label: string
  /** One-line description shown in the library. */
  description: string
  /** Glyph shown when a preview cannot render (fallbacks, empty states). */
  glyph: string
  /**
   * How the library panel previews this type. `glyph` opts a type out of
   * live rendering — used where a live instance is unreadable at tile size
   * and disproportionately expensive (Chart drives canvas measurement).
   */
  preview?: 'live' | 'glyph'
}

export const COMPONENT_CATEGORIES: Array<{
  id: ComponentCategory
  label: string
  description: string
}> = [
  { id: 'basic', label: 'Basic', description: 'Foundations for any page' },
  { id: 'navigation', label: 'Navigation', description: 'Move through the app' },
  { id: 'sections', label: 'Sections', description: 'Page-level building blocks' },
  { id: 'marketing', label: 'Marketing', description: 'Convert and persuade' },
  { id: 'content', label: 'Content', description: 'Editorial and media' },
  { id: 'forms', label: 'Forms', description: 'Capture input' },
  { id: 'dashboard', label: 'Dashboard', description: 'Data display' },
]

export const COMPONENT_CATALOG: ComponentMeta[] = [
  {
    type: 'Button',
    category: 'basic',
    label: 'Button',
    description: 'Clickable button with variants and sizes',
    glyph: '▣',
  },
  {
    type: 'Input',
    category: 'basic',
    label: 'Input',
    description: 'Single-line text input with label',
    glyph: '▭',
  },
  {
    type: 'Card',
    category: 'basic',
    label: 'Card',
    description: 'Content card with header and footer',
    glyph: '▤',
  },
  {
    type: 'Navbar',
    category: 'navigation',
    label: 'Navbar',
    description: 'Top navigation bar with logo and links',
    glyph: '☰',
  },
  {
    type: 'Hero',
    category: 'sections',
    label: 'Hero',
    description: 'Headline, calls to action, and hero image',
    glyph: '◭',
  },
  {
    type: 'CtaBanner',
    category: 'sections',
    label: 'CTA Banner',
    description: 'Focused full-width call to action',
    glyph: '▷',
  },
  {
    type: 'Footer',
    category: 'sections',
    label: 'Footer',
    description: 'Site footer with link columns',
    glyph: '▁',
  },
  {
    type: 'Stats',
    category: 'sections',
    label: 'Stats',
    description: 'Headline metrics row',
    glyph: '▥',
  },
  {
    type: 'Features',
    category: 'marketing',
    label: 'Features',
    description: 'Grid of feature cards',
    glyph: '✦',
  },
  {
    type: 'Pricing',
    category: 'marketing',
    label: 'Pricing',
    description: 'Pricing tiers with feature lists',
    glyph: '◈',
  },
  {
    type: 'Testimonials',
    category: 'marketing',
    label: 'Testimonials',
    description: 'Customer quotes and attributions',
    glyph: '❞',
  },
  {
    type: 'Faq',
    category: 'marketing',
    label: 'FAQ',
    description: 'Expandable questions and answers',
    glyph: '?',
  },
  {
    type: 'Article',
    category: 'content',
    label: 'Article',
    description: 'Long-form editorial content',
    glyph: '¶',
  },
  {
    type: 'Gallery',
    category: 'content',
    label: 'Gallery',
    description: 'Responsive image grid',
    glyph: '◱',
  },
  {
    type: 'LogoCloud',
    category: 'content',
    label: 'Logo Cloud',
    description: 'Customer or partner logos',
    glyph: '▨',
  },
  {
    type: 'ContactForm',
    category: 'forms',
    label: 'Contact Form',
    description: 'Configurable capture form',
    glyph: '✉',
  },
  {
    type: 'Chart',
    category: 'dashboard',
    label: 'Chart',
    description: 'Line, bar, pie, doughnut, or area chart',
    glyph: '▦',
    preview: 'glyph',
  },
  {
    type: 'Table',
    category: 'dashboard',
    label: 'Table',
    description: 'Sortable, filterable data table',
    glyph: '⊞',
  },
]

const metaByType = new Map(COMPONENT_CATALOG.map((m) => [m.type, m]))

/** Display metadata for a schema component type (fallback for unknown types). */
export function getComponentMeta(type: string): ComponentMeta {
  return (
    metaByType.get(type) ?? {
      type,
      category: 'basic',
      label: type,
      description: 'Custom component',
      glyph: '◇',
    }
  )
}

/** Catalog entries filtered by category, in catalog order. */
export function getCatalogByCategory(category: ComponentCategory): ComponentMeta[] {
  return COMPONENT_CATALOG.filter((m) => m.category === category)
}

/** Case-insensitive search over type, label, and description. */
export function searchCatalog(query: string): ComponentMeta[] {
  const q = query.trim().toLowerCase()
  if (!q) return COMPONENT_CATALOG
  return COMPONENT_CATALOG.filter((m) =>
    `${m.type} ${m.label} ${m.description}`.toLowerCase().includes(q)
  )
}
