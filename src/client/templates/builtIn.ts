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

const yearVar: TemplateVariableDef = {
  name: 'year',
  type: 'string',
  description: 'Four-digit year for copyright notices',
  default: (() => {
    const d = new Date()
    return d.getFullYear().toString()
  })(),
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
    description: 'Complete marketing site: hero, features, pricing, testimonials, FAQ, CTA, footer',
    category: 'landing',
    tags: ['landing', 'marketing', 'starter'],
    variables: [appNameVar, primaryColorVar, yearVar],
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
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Testimonials', href: '#testimonials' },
                  { label: 'FAQ', href: '#faq' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_hero',
              type: 'Hero',
              name: 'Hero section',
              props: {
                eyebrow: 'Now in public beta',
                headline: 'Build real websites visually',
                subheadline:
                  'Forge turns your brief into a real, responsive site — components, copy, and layout included. No handoff tickets, no rebuild sprint.',
                primaryCta: 'Start building free',
                secondaryCta: 'See how it works',
                imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
                align: 'left',
              },
            },
            {
              id: 'comp_logo_cloud',
              type: 'LogoCloud',
              name: 'Trusted by',
              props: {
                heading: 'Trusted by thousands of teams',
                logos: [
                  { name: 'Stripe', src: 'https://cdn.simpleicons.org/stripe' },
                  { name: 'GitHub', src: 'https://cdn.simpleicons.org/github' },
                  { name: 'Vercel', src: 'https://cdn.simpleicons.org/vercel' },
                  { name: 'Netlify', src: 'https://cdn.simpleicons.org/netlify' },
                  { name: 'Supabase', src: 'https://cdn.simpleicons.org/supabase' },
                  { name: 'PlanetScale', src: 'https://cdn.simpleicons.org/planetscale' },
                ],
              },
            },
            {
              id: 'comp_features',
              type: 'Features',
              name: 'Key features',
              props: {
                heading: 'Why teams choose Forge',
                subheading: 'Everything you need to ship, all in one place',
                columns: 3,
                items: [
                  {
                    icon: '⚡',
                    title: 'Instant preview',
                    description: 'See your changes live as you build — no refresh needed.',
                  },
                  {
                    icon: '🎨',
                    title: 'Design system',
                    description: 'Built-in tokens, themes, and responsive controls.',
                  },
                  {
                    icon: '🚀',
                    title: 'One-click deploy',
                    description: 'Export to Vercel, Netlify, or run locally with Docker.',
                  },
                ],
              },
            },
            {
              id: 'comp_pricing',
              type: 'Pricing',
              name: 'Simple pricing',
              props: {
                heading: 'Simple, honest pricing',
                subheading: 'Start free, upgrade when the traffic arrives. Cancel whenever you like.',
                tiers: [
                  {
                    name: 'Free',
                    price: '$0',
                    period: 'per month',
                    features: [
                      '1 published site',
                      'Core section library',
                      'Community support',
                    ],
                    highlighted: false,
                    ctaText: 'Get started',
                  },
                  {
                    name: 'Pro',
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
                    name: 'Enterprise',
                    price: '$99',
                    period: 'per month',
                    features: [
                      'Unlimited everything',
                      'Dedicated support',
                      'SLA',
                      'On-premise option',
                    ],
                    highlighted: false,
                    ctaText: 'Contact sales',
                  },
                ],
              },
            },
            {
              id: 'comp_testimonials',
              type: 'Testimonials',
              name: 'What people say',
              props: {
                heading: 'Hear from our customers',
                items: [
                  {
                    quote:
                      'We shipped our marketing site in a single afternoon — no dev team needed.',
                    author: 'Jamie L.',
                    role: 'Founder, Bloom Co.',
                  },
                  {
                    quote:
                      'The visual builder is genuinely fun to use. It feels like Figma meets Webflow.',
                    author: 'Sam R.',
                    role: 'Product Lead, TechCorp',
                  },
                  {
                    quote:
                      'Exporting clean React/Vite code saved us weeks of frontend work.',
                    author: 'Taylor K.',
                    role: 'CTO, StartupXYZ',
                  },
                ],
              },
            },
            {
              id: 'comp_faq_section',
              type: 'Faq',
              name: 'Frequently asked questions',
              props: {
                heading: 'Questions? We have answers.',
                items: [
                  {
                    question: 'Do I need to know how to code?',
                    answer:
                      'No. Forge is a visual builder — you assemble sites by dragging components onto a canvas. The code export is optional.',
                  },
                  {
                    question: 'Can I use my own domain?',
                    answer:
                      'Yes. Once you export the site, you can host it anywhere — Vercel, Netlify, or your own server with Docker.',
                  },
                  {
                    question: 'Is my data private?',
                    answer:
                      'Absolutely. Forge runs locally by default; your data never leaves your machine unless you choose to sync or deploy.',
                  },
                ],
              },
            },
            {
              id: 'comp_cta_banner',
              type: 'CtaBanner',
              name: 'Final call to action',
              props: {
                heading: 'Ready to build?',
                subheading: 'Start with a free site and upgrade whenever you need more power.',
                ctaText: 'Build my first site',
                ctaHref: '#',
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: 'Forge',
                tagline: 'The visual website builder that actually ships.',
                columns: [
                  {
                    title: 'Product',
                    links: [
                      { label: 'Features', href: '#features' },
                      { label: 'Pricing', href: '#pricing' },
                      { label: 'Testimonials', href: '#testimonials' },
                      { label: 'FAQ', href: '#faq' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '#about' },
                      { label: 'Blog', href: '#blog' },
                      { label: 'Careers', href: '#careers' },
                      { label: 'Contact', href: '#contact' },
                    ],
                  },
                  {
                    title: 'Legal',
                    links: [
                      { label: 'Privacy', href: '#privacy' },
                      { label: 'Terms', href: '#terms' },
                    ],
                  },
                ],
                copyright: '© {{year}} Forge. All rights reserved.',
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
    variables: [appNameVar, primaryColorVar, yearVar],
    schema: {
      name: '{{appName}} Dashboard',
      version: '1.0.0',
      pages: [
        {
          id: 'page_dashboard',
          path: '/',
          title: 'Dashboard',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Overview', href: '/' },
                  { label: 'Reports', href: '/reports' },
                  { label: 'Settings', href: '/settings' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_revenue_chart',
              type: 'Chart',
              name: 'Monthly revenue',
              props: {
                type: 'bar',
                chartLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                  {
                    label: 'Revenue',
                    data: [65, 59, 80, 81, 56, 55],
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                  },
                ],
                options: {
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' as const },
                    title: { display: true, text: 'Monthly Revenue (USD)' },
                  },
                },
              },
            },
            {
              id: 'comp_recent_activity',
              type: 'Table',
              name: 'Recent activity',
              props: {
                columns: [
                  { key: 'date', label: 'Date' },
                  { key: 'action', label: 'Action' },
                  { key: 'user', label: 'User' },
                ],
                data: [
                  { date: '2026-10-03', action: 'Site published', user: 'alex@example.com' },
                  { date: '2026-10-02', action: 'Design updated', user: 'sam@example.com' },
                  { date: '2026-10-01', action: 'Domain added', user: 'jamie@example.com' },
                ],
                sortable: true,
                filterable: true,
              },
            },
          ],
        },
      ],
      designTokens: brandTokens(),
    },
  },
  {
    id: 'tmpl_agency',
    name: 'Agency Portfolio',
    description: 'Showcase your work: hero, stats, gallery, testimonials, CTA, footer',
    category: 'landing',
    tags: ['agency', 'portfolio', 'starter'],
    variables: [appNameVar, primaryColorVar, yearVar],
    schema: {
      name: '{{appName}} — Agency',
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
                  { label: 'Work', href: '#work' },
                  { label: 'About', href: '#about' },
                  { label: 'Contact', href: '#contact' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_hero',
              type: 'Hero',
              name: 'Hero section',
              props: {
                eyebrow: 'Award-winning agency',
                headline: 'We build beautiful, high-converting websites',
                subheadline:
                  'From concept to launch, we handle everything — design, development, and deployment.',
                primaryCta: 'View our work',
                secondaryCta: 'Get a quote',
                imageUrl: 'https://images.unsplash.com/photo-1526401250-204150161049?auto=format&fit=crop&w=1200&q=80',
                align: 'left',
              },
            },
            {
              id: 'comp_stats',
              type: 'Stats',
              name: 'Our impact',
              props: {
                heading: 'Trusted by brands worldwide',
                items: [
                  { value: '1,200+', label: 'Projects delivered', description: 'Websites built for clients across industries' },
                  { value: '98%', label: 'Client satisfaction', description: 'Based on post-project surveys' },
                  { value: '15+', label: 'Years experience', description: 'Combined team expertise' },
                ],
              },
            },
            {
              id: 'comp_gallery',
              type: 'Gallery',
              name: 'Featured work',
              props: {
                heading: 'Recent projects',
                columns: 3,
                images: [
                  {
                    src: 'https://images.unsplash.com/photo-1523275335684-3789876b4fb1?auto=format&fit=crop&w=1200&q=80',
                    alt: 'E-commerce site for fashion brand',
                    caption: 'Luxury fashion e-commerce',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1551836022-d5d60442030c?auto=format&fit=crop&w=1200&q=80',
                    alt: 'SaaS dashboard for analytics startup',
                    caption: 'Analytics platform dashboard',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1542744173-8e7e534175e9?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Landing page for mobile app',
                    caption: 'Mobile app launch site',
                  },
                ],
              },
            },
            {
              id: 'comp_testimonials',
              type: 'Testimonials',
              name: 'What clients say',
              props: {
                heading: 'Hear from our clients',
                items: [
                  {
                    quote:
                      'They delivered our site two weeks early and under budget — incredible communication.',
                    author: 'Morgan T.',
                    role: 'Marketing Director, Nordstrom',
                  },
                  {
                    quote:
                      'The team didn’t just build a website — they built a growth engine for our business.',
                    author: 'Casey L.',
                    role: 'Founder, Beam Analytics',
                  },
                  {
                    quote:
                      'From wireframes to launch, they were responsive, professional, and a joy to work with.',
                    author: 'Riley P.',
                    role: 'Product Lead, Shopify Plus Agency',
                  },
                ],
              },
            },
            {
              id: 'comp_cta_banner',
              type: 'CtaBanner',
              name: 'Final call to action',
              props: {
                heading: 'Ready to work together?',
                subheading: 'Let’s build something amazing for your brand.',
                ctaText: 'Start a project',
                ctaHref: '#contact',
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Beautiful websites that convert.',
                columns: [
                  {
                    title: 'Services',
                    links: [
                      { label: 'Web Design', href: '#services' },
                      { label: 'Web Development', href: '#services' },
                      { label: 'SEO', href: '#services' },
                      { label: 'Branding', href: '#services' },
                    ],
                  },
                  {
                    title: 'Industries',
                    links: [
                      { label: 'E-commerce', href: '#industries' },
                      { label: 'SaaS', href: '#industries' },
                      { label: 'Healthcare', href: '#industries' },
                      { label: 'Finance', href: '#industries' },
                    ],
                  },
                  {
                    title: 'Legal',
                    links: [
                      { label: 'Privacy', href: '#privacy' },
                      { label: 'Terms', href: '#terms' },
                    ],
                  },
                ],
                copyright: '© {{year}} {{appName}}. All rights reserved.',
              },
            },
          ],
        },
      ],
      designTokens: brandTokens(),
    },
  },
  {
    id: 'tmpl_blog',
    name: 'Content Blog',
    description: 'Navbar, article series, and footer — ideal for newsletters and long-form writing',
    category: 'other',
    tags: ['blog', 'content', 'starter'],
    variables: [appNameVar, primaryColorVar, yearVar],
    schema: {
      name: '{{appName}} Blog',
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
                  { label: 'Latest', href: '/' },
                  { label: 'Archive', href: '/archive' },
                  { label: 'About', href: '/about' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'Latest post',
              props: {
                heading: 'How to build a website in 2026',
                body:
                  'Building a website today is easier than ever. With visual builders like Forge, you can go from idea to live site in a single afternoon — no code required.\n\nStart with a clear goal: what do you want your site to do? Then choose a template or build from scratch using the component library. Drag, drop, and customize until it feels right.\n\nWhen you’re happy, hit publish. Your site is live, and you can iterate anytime.\n\nThe future of web building is visual, fast, and fun.',
                author: 'Jordan Lee',
                publishedAt: '2026-09-15',
              },
            },
          ],
        },
        {
          id: 'page_about',
          path: '/about',
          title: 'About',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Home', href: '/' },
                  { label: 'Latest', href: '/' },
                  { label: 'Archive', href: '/archive' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'About this blog',
              props: {
                heading: 'About {{appName}}',
                body:
                  '{{appName}} is a visual website builder that lets anyone create professional websites without writing code. We believe the web should be accessible to everyone — designers, founders, bloggers, and small businesses.\n\nOur mission is to democratize web creation so you can focus on what matters: your content, your audience, and your goals.\n\nWe started as a side project and grew into a tool used by thousands of creators worldwide. Today, we’re committed to making web building visual, fast, and fun.',
                author: 'The Forge Team',
                publishedAt: '2026-01-01',
              },
            },
          ],
        },
        {
          id: 'page_archive',
          path: '/archive',
          title: 'Archive',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Home', href: '/' },
                  { label: 'Latest', href: '/' },
                  { label: 'About', href: '/about' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'Post title',
              props: {
                heading: 'Sample post title',
                body:
                  'This is a sample blog post. Replace this content with your own writing — stories, tutorials, news, or anything you want to share with the world.\n\nBlogging is a powerful way to connect with your audience, build authority, and drive traffic to your site.',
                author: 'Guest Writer',
                publishedAt: '2026-09-01',
              },
            },
          ],
        },
      ],
      designTokens: brandTokens(),
    },
  },
]

/** Look up a built-in starter by id. */
export function getBuiltInTemplate(id: string): BuiltInTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id)
}