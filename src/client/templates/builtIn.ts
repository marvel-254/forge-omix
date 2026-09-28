import type { TemplateVariableDef } from './substitute'

/**
 * Built-in project starters (docs/06 §6.7). Each template's `schema` holds
 * page/component/design-token content with `{{variable}}` placeholders;
 * `instantiateTemplate` (./instantiate) substitutes values and produces a
 * canonical project for `loadProject` to validate.
 */

export interface BuiltInTemplate {
  id: string
  name: string
  description: string
  category: 'landing' | 'dashboard' | 'other'
  tags: string[]
  variables: TemplateVariableDef[]
  schema: {
    name?: string
    version?: string
    pages?: Array<Record<string, unknown>>
    components?: Array<Record<string, unknown>>
    designTokens?: Record<string, unknown>
  }
}

const appNameVar: TemplateVariableDef = {
  name: 'appName',
  type: 'string',
  description: 'Application name shown in the navbar and headings',
  default: 'My App',
  required: true,
}

const primaryColorVar: TemplateVariableDef = {
  name: 'primaryColor',
  type: 'color',
  description: 'Primary brand color used across the project',
  default: '#3b82f6',
  required: false,
}

function brandTokens(): Record<string, unknown> {
  return {
    colors: { primary: '{{primaryColor}}' },
    typography: { fontFamily: { sans: 'Inter, system-ui, sans-serif' } },
    spacing: { sm: '0.25rem', md: '1rem', lg: '2rem' },
    radius: { md: '0.5rem' },
    shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)' },
    breakpoints: { sm: 640, md: 768, lg: 1024 },
  }
}

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'tmpl_blank',
    name: 'Blank',
    description: 'Empty project with a single home page',
    category: 'other',
    tags: ['starter', 'blank'],
    variables: [],
    schema: {
      name: 'Untitled Project',
      version: '1.0.0',
      pages: [{ id: 'page_home', path: '/', title: 'Home', components: [] }],
    },
  },
  {
    id: 'tmpl_landing',
    name: 'Landing Page',
    description: 'Navbar, hero card, and call-to-action button',
    category: 'landing',
    tags: ['landing', 'marketing', 'starter'],
    variables: [appNameVar, primaryColorVar],
    schema: {
      name: '{{appName}}',
      version: '1.0.0',
      pages: [
        {
          id: 'page_home',
          path: '/',
          title: 'Home',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Features', href: '#features' },
                  { label: 'About', href: '#about' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_hero',
              type: 'Card',
              name: 'Hero card',
              props: {
                header: 'Welcome to {{appName}}',
                content: 'Ship production applications from a visual canvas.',
                footer: '',
                elevation: 1,
              },
            },
            {
              id: 'comp_cta_btn',
              type: 'Button',
              name: 'Call to action',
              props: {
                label: 'Get started',
                variant: 'primary',
                size: 'lg',
                disabled: false,
                icon: '',
              },
            },
          ],
        },
      ],
      designTokens: brandTokens(),
    },
  },
  {
    id: 'tmpl_dashboard',
    name: 'SaaS Dashboard',
    description: 'Navbar, revenue chart, and data table',
    category: 'dashboard',
    tags: ['dashboard', 'charts', 'saas', 'starter'],
    variables: [appNameVar, primaryColorVar],
    schema: {
      name: '{{appName}} Dashboard',
      version: '1.0.0',
      pages: [
        {
          id: 'page_dashboard',
          path: '/dashboard',
          title: 'Dashboard',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Settings', href: '/settings' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_revenue',
              type: 'Chart',
              name: 'Revenue chart',
              props: {
                type: 'bar',
                chartLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{ label: 'Revenue', values: '12, 30, 18, 24' }],
                responsive: true,
              },
            },
            {
              id: 'comp_table',
              type: 'Table',
              name: 'Recent orders',
              props: {
                columns: [
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: 'Name' },
                ],
                data: [
                  { id: 1, name: 'Item 1' },
                  { id: 2, name: 'Item 2' },
                ],
                sortable: true,
                filterable: false,
              },
            },
          ],
        },
      ],
      designTokens: brandTokens(),
    },
  },
]

export function getBuiltInTemplate(id: string): BuiltInTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id)
}
