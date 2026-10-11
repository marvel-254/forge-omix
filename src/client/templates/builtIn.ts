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
  {
    id: 'tmpl_ecommerce',
    name: 'E-commerce Store',
    description: 'Multi-page storefront: shop grid, product detail, and checkout',
    category: 'other',
    tags: ['ecommerce', 'store', 'shop', 'starter'],
    variables: [appNameVar, primaryColorVar, yearVar],
    schema: {
      name: '{{appName}} Store',
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
                  { label: 'Shop', href: '/shop' },
                  { label: 'About', href: '/about' },
                  { label: 'Contact', href: '/contact' },
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
                eyebrow: 'New season, new arrivals',
                headline: 'Shop the collection everyone is talking about',
                subheadline:
                  'Thoughtfully made pieces, fair prices, and shipping that actually shows up on time. Browse the full range or start with our best sellers.',
                primaryCta: 'Shop now',
                secondaryCta: 'View lookbook',
                imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
                align: 'left',
              },
            },
            {
              id: 'comp_logo_cloud',
              type: 'LogoCloud',
              name: 'As seen in',
              props: {
                heading: 'Featured in',
                logos: [
                  { name: 'Vogue', src: 'https://cdn.simpleicons.org/vogue' },
                  { name: 'Elle', src: 'https://cdn.simpleicons.org/elle' },
                  { name: 'GQ', src: 'https://cdn.simpleicons.org/gq' },
                  { name: 'Forbes', src: 'https://cdn.simpleicons.org/forbes' },
                  { name: 'Wired', src: 'https://cdn.simpleicons.org/wired' },
                ],
              },
            },
            {
              id: 'comp_features',
              type: 'Features',
              name: 'Why shop with us',
              props: {
                heading: 'Shopping made simple',
                subheading: 'Everything you need for a stress-free purchase',
                columns: 3,
                items: [
                  {
                    icon: '🚚',
                    title: 'Free shipping',
                    description: 'Free standard shipping on all orders over $50, worldwide.',
                  },
                  {
                    icon: '↩️',
                    title: 'Easy returns',
                    description: '30-day returns, no questions asked. We make it painless.',
                  },
                  {
                    icon: '🔒',
                    title: 'Secure checkout',
                    description: 'PCI-compliant payments with full buyer protection.',
                  },
                ],
              },
            },
            {
              id: 'comp_gallery',
              type: 'Gallery',
              name: 'Best sellers',
              props: {
                heading: 'Best sellers',
                columns: 3,
                images: [
                  {
                    src: 'https://images.unsplash.com/photo-1523275335684-3789876b4fb1?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Minimalist watch with leather strap',
                    caption: 'Classic Leather Watch — $129',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Red running shoes on white background',
                    caption: 'Aero Runner Sneakers — $89',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
                    alt: 'White cotton t-shirt',
                    caption: 'Essential Tee — $24',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Leather handbag',
                    caption: 'Everyday Tote — $149',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80',
                    alt: 'White ceramic coffee mug',
                    caption: 'Ceramic Mug Set — $32',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Camera on a table',
                    caption: 'Vintage Camera — $299',
                  },
                ],
              },
            },
            {
              id: 'comp_testimonials',
              type: 'Testimonials',
              name: 'What customers say',
              props: {
                heading: 'Loved by thousands',
                items: [
                  {
                    quote:
                      'The quality is unreal for the price. My order arrived in two days, beautifully packaged.',
                    author: 'Maya R.',
                    role: 'Verified buyer',
                  },
                  {
                    quote:
                      'Returns were genuinely painless — they sent a label and refunded me the same day.',
                    author: 'Daniel K.',
                    role: 'Verified buyer',
                  },
                  {
                    quote:
                      'I’ve bought from them three times now. The fit is consistent and the fabric holds up.',
                    author: 'Priya S.',
                    role: 'Verified buyer',
                  },
                ],
              },
            },
            {
              id: 'comp_cta_banner',
              type: 'CtaBanner',
              name: 'Join the list',
              props: {
                heading: 'Get 10% off your first order',
                subheading: 'Join our newsletter for early access to drops and members-only deals.',
                ctaText: 'Claim my discount',
                ctaHref: '#',
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Quality pieces, fair prices, delivered on time.',
                columns: [
                  {
                    title: 'Shop',
                    links: [
                      { label: 'All products', href: '/shop' },
                      { label: 'New arrivals', href: '/shop' },
                      { label: 'Best sellers', href: '/shop' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '/about' },
                      { label: 'Contact', href: '/contact' },
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
        {
          id: 'page_shop',
          path: '/shop',
          title: 'Shop',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Shop', href: '/shop' },
                  { label: 'About', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_hero',
              type: 'Hero',
              name: 'Shop header',
              props: {
                eyebrow: 'The full collection',
                headline: 'Every product, one place',
                subheadline:
                  'Browse the complete range. Filter by category, sort by price, and find your new favorite.',
                primaryCta: 'Shop best sellers',
                secondaryCta: 'New arrivals',
                imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=80',
                align: 'center',
              },
            },
            {
              id: 'comp_gallery',
              type: 'Gallery',
              name: 'All products',
              props: {
                heading: 'All products',
                columns: 3,
                images: [
                  {
                    src: 'https://images.unsplash.com/photo-1523275335684-3789876b4fb1?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Minimalist watch with leather strap',
                    caption: 'Classic Leather Watch — $129',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Red running shoes',
                    caption: 'Aero Runner Sneakers — $89',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
                    alt: 'White cotton t-shirt',
                    caption: 'Essential Tee — $24',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Leather handbag',
                    caption: 'Everyday Tote — $149',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80',
                    alt: 'White ceramic coffee mug',
                    caption: 'Ceramic Mug Set — $32',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Camera on a table',
                    caption: 'Vintage Camera — $299',
                  },
                ],
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Quality pieces, fair prices, delivered on time.',
                columns: [
                  {
                    title: 'Shop',
                    links: [
                      { label: 'All products', href: '/shop' },
                      { label: 'New arrivals', href: '/shop' },
                      { label: 'Best sellers', href: '/shop' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '/about' },
                      { label: 'Contact', href: '/contact' },
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
        {
          id: 'page_product',
          path: '/product',
          title: 'Product',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Shop', href: '/shop' },
                  { label: 'About', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_media',
              type: 'Media',
              name: 'Product image',
              props: {
                src: 'https://images.unsplash.com/photo-1523275335684-3789876b4fb1?auto=format&fit=crop&w=1200&q=80',
                alt: 'Classic Leather Watch with brown strap',
                mediaType: 'image',
                fit: 'cover',
                caption: 'Classic Leather Watch — $129',
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'Product description',
              props: {
                heading: 'Classic Leather Watch',
                body:
                  'A timeless timepiece with a genuine leather strap, sapphire crystal, and a precision quartz movement. Water resistant to 50 meters.\n\nEvery watch is inspected by hand before it ships, and comes with a two-year warranty.\n\nFree shipping on orders over $50, with 30-day returns.',
                author: '{{appName}}',
                publishedAt: '2026-09-01',
              },
            },
            {
              id: 'comp_features',
              type: 'Features',
              name: 'Product highlights',
              props: {
                heading: 'Why you’ll love it',
                subheading: 'The details that make the difference',
                columns: 3,
                items: [
                  {
                    icon: '⌚',
                    title: 'Precision movement',
                    description: 'Japanese quartz movement, accurate to ±15 seconds a month.',
                  },
                  {
                    icon: '🛡️',
                    title: 'Two-year warranty',
                    description: 'Every watch is covered for two full years, no fine print.',
                  },
                  {
                    icon: '📦',
                    title: 'Gift-ready packaging',
                    description: 'Arrives in a premium box, ready to gift or keep.',
                  },
                ],
              },
            },
            {
              id: 'comp_cta_banner',
              type: 'CtaBanner',
              name: 'Add to cart',
              props: {
                heading: 'Ready to make it yours?',
                subheading: 'Add the Classic Leather Watch to your cart and check out in under a minute.',
                ctaText: 'Add to cart — $129',
                ctaHref: '#',
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Quality pieces, fair prices, delivered on time.',
                columns: [
                  {
                    title: 'Shop',
                    links: [
                      { label: 'All products', href: '/shop' },
                      { label: 'New arrivals', href: '/shop' },
                      { label: 'Best sellers', href: '/shop' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '/about' },
                      { label: 'Contact', href: '/contact' },
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
        {
          id: 'page_checkout',
          path: '/checkout',
          title: 'Checkout',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Shop', href: '/shop' },
                  { label: 'About', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_table',
              type: 'Table',
              name: 'Order summary',
              props: {
                columns: [
                  { key: 'item', label: 'Item' },
                  { key: 'qty', label: 'Qty' },
                  { key: 'price', label: 'Price' },
                ],
                data: [
                  { item: 'Classic Leather Watch', qty: 1, price: '$129' },
                  { item: 'Essential Tee', qty: 2, price: '$48' },
                  { item: 'Ceramic Mug Set', qty: 1, price: '$32' },
                ],
                sortable: false,
                filterable: false,
              },
            },
            {
              id: 'comp_contact',
              type: 'ContactForm',
              name: 'Checkout form',
              props: {
                heading: 'Shipping details',
                subheading: 'Tell us where to send your order. All fields are required.',
                fields: [
                  { name: 'name', label: 'Full name', type: 'text', placeholder: 'Ada Lovelace', required: true },
                  { name: 'email', label: 'Email', type: 'email', placeholder: 'ada@example.com', required: true },
                  { name: 'address', label: 'Street address', type: 'text', placeholder: '123 Main St', required: true },
                  { name: 'city', label: 'City', type: 'text', placeholder: 'San Francisco', required: true },
                  { name: 'zip', label: 'ZIP code', type: 'text', placeholder: '94103', required: true },
                ],
                submitText: 'Place order',
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Quality pieces, fair prices, delivered on time.',
                columns: [
                  {
                    title: 'Shop',
                    links: [
                      { label: 'All products', href: '/shop' },
                      { label: 'New arrivals', href: '/shop' },
                      { label: 'Best sellers', href: '/shop' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '/about' },
                      { label: 'Contact', href: '/contact' },
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
    id: 'tmpl_admin',
    name: 'Admin Panel',
    description: 'Multi-page admin: dashboard KPIs, reports, and settings',
    category: 'dashboard',
    tags: ['admin', 'dashboard', 'saas', 'starter'],
    variables: [appNameVar, primaryColorVar, yearVar],
    schema: {
      name: '{{appName}} Admin',
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
              id: 'comp_stats',
              type: 'Stats',
              name: 'Key metrics',
              props: {
                heading: 'This week at a glance',
                items: [
                  { value: '12,480', label: 'Active users', description: 'Up 8% from last week' },
                  { value: '$84.2k', label: 'Revenue', description: 'MRR across all plans' },
                  { value: '3.2%', label: 'Conversion', description: 'Visitors to signups' },
                  { value: '99.98%', label: 'Uptime', description: 'Rolling 30-day average' },
                ],
              },
            },
            {
              id: 'comp_chart',
              type: 'Chart',
              name: 'Revenue trend',
              props: {
                type: 'line',
                chartLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [
                  { label: 'Revenue', values: '42, 48, 53, 61, 68, 74, 84', color: '#3b82f6' },
                  { label: 'Costs', values: '30, 32, 35, 38, 41, 43, 46', color: '#10b981' },
                ],
                responsive: true,
              },
            },
            {
              id: 'comp_table',
              type: 'Table',
              name: 'Recent signups',
              props: {
                columns: [
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'plan', label: 'Plan' },
                  { key: 'status', label: 'Status' },
                ],
                data: [
                  { name: 'Ada Lovelace', email: 'ada@example.com', plan: 'Pro', status: 'Active' },
                  { name: 'Grace Hopper', email: 'grace@example.com', plan: 'Free', status: 'Active' },
                  { name: 'Alan Turing', email: 'alan@example.com', plan: 'Pro', status: 'Trial' },
                  { name: 'Katherine Johnson', email: 'katherine@example.com', plan: 'Enterprise', status: 'Active' },
                  { name: 'Linus Torvalds', email: 'linus@example.com', plan: 'Free', status: 'Inactive' },
                ],
                sortable: true,
                filterable: true,
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'The control plane for your business.',
                columns: [
                  {
                    title: 'Product',
                    links: [
                      { label: 'Overview', href: '/' },
                      { label: 'Reports', href: '/reports' },
                      { label: 'Settings', href: '/settings' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '#about' },
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
                copyright: '© {{year}} {{appName}}. All rights reserved.',
              },
            },
          ],
        },
        {
          id: 'page_reports',
          path: '/reports',
          title: 'Reports',
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
              id: 'comp_chart',
              type: 'Chart',
              name: 'Acquisition channels',
              props: {
                type: 'bar',
                chartLabels: ['Organic', 'Paid', 'Referral', 'Social', 'Email'],
                datasets: [
                  { label: 'Visitors', values: '3200, 2100, 1400, 980, 760', color: '#3b82f6' },
                  { label: 'Signups', values: '410, 260, 180, 120, 95', color: '#10b981' },
                ],
                responsive: true,
              },
            },
            {
              id: 'comp_chart',
              type: 'Chart',
              name: 'Plan distribution',
              props: {
                type: 'doughnut',
                chartLabels: ['Free', 'Pro', 'Enterprise'],
                datasets: [
                  { label: 'Customers', values: '6200, 1800, 240', color: '#3b82f6' },
                ],
                responsive: true,
              },
            },
            {
              id: 'comp_table',
              type: 'Table',
              name: 'Top customers',
              props: {
                columns: [
                  { key: 'company', label: 'Company' },
                  { key: 'plan', label: 'Plan' },
                  { key: 'mrr', label: 'MRR' },
                  { key: 'growth', label: 'Growth' },
                ],
                data: [
                  { company: 'Northwind', plan: 'Enterprise', mrr: '$4,200', growth: '+12%' },
                  { company: 'Acme Corp', plan: 'Pro', mrr: '$1,800', growth: '+8%' },
                  { company: 'Globex', plan: 'Pro', mrr: '$1,400', growth: '+5%' },
                  { company: 'Initech', plan: 'Enterprise', mrr: '$3,100', growth: '+3%' },
                ],
                sortable: true,
                filterable: true,
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'The control plane for your business.',
                columns: [
                  {
                    title: 'Product',
                    links: [
                      { label: 'Overview', href: '/' },
                      { label: 'Reports', href: '/reports' },
                      { label: 'Settings', href: '/settings' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '#about' },
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
                copyright: '© {{year}} {{appName}}. All rights reserved.',
              },
            },
          ],
        },
        {
          id: 'page_settings',
          path: '/settings',
          title: 'Settings',
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
              id: 'comp_contact',
              type: 'ContactForm',
              name: 'Workspace settings',
              props: {
                heading: 'Workspace settings',
                subheading: 'Update your organization profile and notification preferences.',
                fields: [
                  { name: 'name', label: 'Workspace name', type: 'text', placeholder: 'Acme Corp', required: true },
                  { name: 'email', label: 'Billing email', type: 'email', placeholder: 'billing@acme.com', required: true },
                  { name: 'website', label: 'Website', type: 'url', placeholder: 'https://acme.com', required: false },
                  { name: 'timezone', label: 'Timezone', type: 'text', placeholder: 'UTC-8', required: false },
                ],
                submitText: 'Save changes',
              },
            },
            {
              id: 'comp_table',
              type: 'Table',
              name: 'Team members',
              props: {
                columns: [
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'role', label: 'Role' },
                ],
                data: [
                  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Owner' },
                  { name: 'Grace Hopper', email: 'grace@example.com', role: 'Admin' },
                  { name: 'Alan Turing', email: 'alan@example.com', role: 'Member' },
                ],
                sortable: true,
                filterable: true,
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'The control plane for your business.',
                columns: [
                  {
                    title: 'Product',
                    links: [
                      { label: 'Overview', href: '/' },
                      { label: 'Reports', href: '/reports' },
                      { label: 'Settings', href: '/settings' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '#about' },
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
    id: 'tmpl_docs',
    name: 'Documentation',
    description: 'Multi-page docs site: guides, API reference, and changelog',
    category: 'other',
    tags: ['docs', 'documentation', 'reference', 'starter'],
    variables: [appNameVar, primaryColorVar, yearVar],
    schema: {
      name: '{{appName}} Docs',
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
                  { label: 'Guides', href: '/guides' },
                  { label: 'API', href: '/api' },
                  { label: 'Changelog', href: '/changelog' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_hero',
              type: 'Hero',
              name: 'Docs hero',
              props: {
                eyebrow: 'Documentation',
                headline: 'Everything you need to build with {{appName}}',
                subheadline:
                  'Guides, API reference, and examples to get you from zero to shipping. Start with the quickstart or jump straight to the reference.',
                primaryCta: 'Read the quickstart',
                secondaryCta: 'Browse the API',
                imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
                align: 'left',
              },
            },
            {
              id: 'comp_features',
              type: 'Features',
              name: 'Explore the docs',
              props: {
                heading: 'Start here',
                subheading: 'The fastest path to your first build',
                columns: 3,
                items: [
                  {
                    icon: '🚀',
                    title: 'Quickstart',
                    description: 'Install, configure, and ship your first project in under five minutes.',
                  },
                  {
                    icon: '📚',
                    title: 'Guides',
                    description: 'Step-by-step walkthroughs for common workflows and integrations.',
                  },
                  {
                    icon: '🔌',
                    title: 'API reference',
                    description: 'Every endpoint, parameter, and response documented with examples.',
                  },
                ],
              },
            },
            {
              id: 'comp_faq_section',
              type: 'Faq',
              name: 'Common questions',
              props: {
                heading: 'Frequently asked',
                items: [
                  {
                    question: 'How do I get started?',
                    answer:
                      'Follow the quickstart guide. It covers installation, your first API call, and a working example in about five minutes.',
                  },
                  {
                    question: 'Is there a free tier?',
                    answer:
                      'Yes. Every plan starts with a generous free tier that includes the core API and community support.',
                  },
                  {
                    question: 'Where can I ask questions?',
                    answer:
                      'Join our community forum or open a GitHub discussion. Our team answers within one business day.',
                  },
                ],
              },
            },
            {
              id: 'comp_cta_banner',
              type: 'CtaBanner',
              name: 'Get help',
              props: {
                heading: 'Still stuck?',
                subheading: 'Our support team and community are here to help you ship.',
                ctaText: 'Contact support',
                ctaHref: '#',
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Documentation for building with {{appName}}.',
                columns: [
                  {
                    title: 'Docs',
                    links: [
                      { label: 'Guides', href: '/guides' },
                      { label: 'API reference', href: '/api' },
                      { label: 'Changelog', href: '/changelog' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '#about' },
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
                copyright: '© {{year}} {{appName}}. All rights reserved.',
              },
            },
          ],
        },
        {
          id: 'page_guides',
          path: '/guides',
          title: 'Guides',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Guides', href: '/guides' },
                  { label: 'API', href: '/api' },
                  { label: 'Changelog', href: '/changelog' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'Quickstart guide',
              props: {
                heading: 'Quickstart: your first build',
                body:
                  'Welcome! This guide gets you from zero to a working integration in about five minutes.\n\nFirst, install the SDK with your package manager. Then create a client with your API key. Finally, make your first request.\n\nThat’s it. You now have a working integration. From here, explore the guides for authentication, webhooks, and rate limits.',
                author: 'The {{appName}} Team',
                publishedAt: '2026-09-01',
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'Authentication guide',
              props: {
                heading: 'Authentication',
                body:
                  'Every request to the {{appName}} API must be authenticated with an API key.\n\nPass your key in the Authorization header as a Bearer token. Keys are scoped to your workspace and can be rotated at any time.\n\nNever commit keys to source control. Use environment variables or a secrets manager instead.',
                author: 'The {{appName}} Team',
                publishedAt: '2026-09-05',
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'Webhooks guide',
              props: {
                heading: 'Webhooks',
                body:
                  'Webhooks let you receive real-time notifications when events happen in your workspace.\n\nCreate a webhook endpoint, register it in the dashboard, and we’ll POST a signed payload to it whenever an event fires.\n\nVerify the signature on every request to keep your endpoint secure.',
                author: 'The {{appName}} Team',
                publishedAt: '2026-09-10',
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Documentation for building with {{appName}}.',
                columns: [
                  {
                    title: 'Docs',
                    links: [
                      { label: 'Guides', href: '/guides' },
                      { label: 'API reference', href: '/api' },
                      { label: 'Changelog', href: '/changelog' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '#about' },
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
                copyright: '© {{year}} {{appName}}. All rights reserved.',
              },
            },
          ],
        },
        {
          id: 'page_api_ref',
          path: '/api',
          title: 'API Reference',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Guides', href: '/guides' },
                  { label: 'API', href: '/api' },
                  { label: 'Changelog', href: '/changelog' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'API overview',
              props: {
                heading: 'API Reference',
                body:
                  'The {{appName}} API is a RESTful interface to everything in your workspace.\n\nAll requests go to https://api.example.com/v1. Responses are JSON, and errors use standard HTTP status codes with a consistent error body.\n\nEvery endpoint below includes request and response examples.',
                author: 'The {{appName}} Team',
                publishedAt: '2026-09-01',
              },
            },
            {
              id: 'comp_table',
              type: 'Table',
              name: 'Endpoints',
              props: {
                columns: [
                  { key: 'method', label: 'Method' },
                  { key: 'path', label: 'Path' },
                  { key: 'description', label: 'Description' },
                ],
                data: [
                  { method: 'GET', path: '/v1/projects', description: 'List all projects' },
                  { method: 'POST', path: '/v1/projects', description: 'Create a project' },
                  { method: 'GET', path: '/v1/projects/:id', description: 'Get a project' },
                  { method: 'PUT', path: '/v1/projects/:id', description: 'Update a project' },
                  { method: 'DELETE', path: '/v1/projects/:id', description: 'Delete a project' },
                  { method: 'GET', path: '/v1/keys', description: 'List API keys' },
                ],
                sortable: true,
                filterable: true,
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'Error handling',
              props: {
                heading: 'Errors',
                body:
                  'Errors are returned with a JSON body describing what went wrong.\n\nA 400 means the request was malformed. A 401 means authentication failed. A 404 means the resource was not found. A 429 means you hit a rate limit.\n\nEvery error includes a code, a message, and a request ID you can reference when contacting support.',
                author: 'The {{appName}} Team',
                publishedAt: '2026-09-12',
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Documentation for building with {{appName}}.',
                columns: [
                  {
                    title: 'Docs',
                    links: [
                      { label: 'Guides', href: '/guides' },
                      { label: 'API reference', href: '/api' },
                      { label: 'Changelog', href: '/changelog' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '#about' },
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
                copyright: '© {{year}} {{appName}}. All rights reserved.',
              },
            },
          ],
        },
        {
          id: 'page_changelog',
          path: '/changelog',
          title: 'Changelog',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Guides', href: '/guides' },
                  { label: 'API', href: '/api' },
                  { label: 'Changelog', href: '/changelog' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'Version 2.0',
              props: {
                heading: 'v2.0 — The big one',
                body:
                  'Today we’re shipping the largest release in {{appName}} history.\n\nNew: a redesigned dashboard, real-time sync, and a fully rewritten API client.\n\nBreaking: the v1 API is deprecated. Migrate with our one-click upgrade tool before the end of the year.',
                author: 'The {{appName}} Team',
                publishedAt: '2026-10-01',
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'Version 1.8',
              props: {
                heading: 'v1.8 — Performance',
                body:
                  'This release focuses on speed.\n\nWe cut API latency by 40%, reduced bundle size by 25%, and added edge caching to every region.\n\nNo breaking changes. Just faster.',
                author: 'The {{appName}} Team',
                publishedAt: '2026-09-15',
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'Version 1.5',
              props: {
                heading: 'v1.5 — Collaboration',
                body:
                  'Teams can now share workspaces, leave comments, and review changes together.\n\nInvite your team, set roles, and keep everyone in sync with real-time presence.',
                author: 'The {{appName}} Team',
                publishedAt: '2026-08-20',
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Documentation for building with {{appName}}.',
                columns: [
                  {
                    title: 'Docs',
                    links: [
                      { label: 'Guides', href: '/guides' },
                      { label: 'API reference', href: '/api' },
                      { label: 'Changelog', href: '/changelog' },
                    ],
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '#about' },
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
    id: 'tmpl_restaurant',
    name: 'Restaurant',
    description: 'Multi-page restaurant site: menu, about, and reservations',
    category: 'other',
    tags: ['restaurant', 'food', 'menu', 'starter'],
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
                  { label: 'Menu', href: '/menu' },
                  { label: 'About', href: '/about' },
                  { label: 'Contact', href: '/contact' },
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
                eyebrow: 'Farm to table, since 2012',
                headline: 'Seasonal cooking, honest ingredients',
                subheadline:
                  'A neighborhood restaurant serving dishes built around what’s fresh at the market. Reservations recommended, walk-ins welcome.',
                primaryCta: 'View the menu',
                secondaryCta: 'Book a table',
                imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
                align: 'left',
              },
            },
            {
              id: 'comp_stats',
              type: 'Stats',
              name: 'At a glance',
              props: {
                heading: 'Why guests keep coming back',
                items: [
                  { value: '12+', label: 'Years serving', description: 'A neighborhood staple since 2012' },
                  { value: '4.9', label: 'Average rating', description: 'Across 2,100+ reviews' },
                  { value: '100%', label: 'Local produce', description: 'Sourced within 100 miles' },
                  { value: '40+', label: 'Wines by the glass', description: 'Rotating seasonal list' },
                ],
              },
            },
            {
              id: 'comp_gallery',
              type: 'Gallery',
              name: 'From the kitchen',
              props: {
                heading: 'A taste of what’s cooking',
                columns: 3,
                images: [
                  {
                    src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Colorful salad bowl with fresh vegetables',
                    caption: 'Market salad — $14',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Wood-fired pizza with basil',
                    caption: 'Margherita pizza — $18',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Grilled steak with herbs',
                    caption: 'Grass-fed ribeye — $38',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Pasta dish with tomato sauce',
                    caption: 'Handmade tagliatelle — $22',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Chocolate dessert',
                    caption: 'Dark chocolate tart — $12',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Cozy restaurant interior',
                    caption: 'Our dining room',
                  },
                ],
              },
            },
            {
              id: 'comp_testimonials',
              type: 'Testimonials',
              name: 'Guest reviews',
              props: {
                heading: 'What our guests say',
                items: [
                  {
                    quote:
                      'The best meal I’ve had in years. Every dish tasted like it was made with love.',
                    author: 'Elena M.',
                    role: 'Regular guest',
                  },
                  {
                    quote:
                      'Incredible service and a wine list that pairs perfectly with everything on the menu.',
                    author: 'James T.',
                    role: 'First-time visitor',
                  },
                  {
                    quote:
                      'We celebrated our anniversary here. The staff made it unforgettable.',
                    author: 'Sofia & Daniel',
                    role: 'Anniversary dinner',
                  },
                ],
              },
            },
            {
              id: 'comp_cta_banner',
              type: 'CtaBanner',
              name: 'Book a table',
              props: {
                heading: 'Join us for dinner',
                subheading: 'Reserve your table online or call us — we’d love to host you.',
                ctaText: 'Book a reservation',
                ctaHref: '#',
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Seasonal cooking, honest ingredients, warm hospitality.',
                columns: [
                  {
                    title: 'Visit',
                    links: [
                      { label: 'Menu', href: '/menu' },
                      { label: 'About', href: '/about' },
                      { label: 'Contact', href: '/contact' },
                    ],
                  },
                  {
                    title: 'Hours',
                    links: [
                      { label: 'Mon–Fri: 11am–10pm', href: '#' },
                      { label: 'Sat–Sun: 10am–11pm', href: '#' },
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
        {
          id: 'page_menu',
          path: '/menu',
          title: 'Menu',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Menu', href: '/menu' },
                  { label: 'About', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_hero',
              type: 'Hero',
              name: 'Menu header',
              props: {
                eyebrow: 'The menu',
                headline: 'Seasonal, market-driven, always fresh',
                subheadline:
                  'Our menu changes with the seasons. Here’s a taste of what’s on the table right now.',
                primaryCta: 'Book a table',
                secondaryCta: 'View wine list',
                imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
                align: 'center',
              },
            },
            {
              id: 'comp_pricing',
              type: 'Pricing',
              name: 'Dinner menu',
              props: {
                heading: 'Tonight’s menu',
                subheading: 'A la carte, served family-style. Prices in USD.',
                tiers: [
                  {
                    name: 'Starters',
                    price: '$14',
                    period: 'avg',
                    features: [
                      'Market salad',
                      'Wood-fired flatbread',
                      'Roasted beet hummus',
                      'Charred octopus',
                    ],
                    highlighted: false,
                    ctaText: 'Order starters',
                  },
                  {
                    name: 'Mains',
                    price: '$28',
                    period: 'avg',
                    features: [
                      'Grass-fed ribeye',
                      'Handmade tagliatelle',
                      'Pan-seared salmon',
                      'Wood-fired pizza',
                    ],
                    highlighted: true,
                    ctaText: 'Order mains',
                  },
                  {
                    name: 'Desserts',
                    price: '$12',
                    period: 'avg',
                    features: [
                      'Dark chocolate tart',
                      'Seasonal sorbet',
                      'Olive oil cake',
                      'Affogato',
                    ],
                    highlighted: false,
                    ctaText: 'Order dessert',
                  },
                ],
              },
            },
            {
              id: 'comp_gallery',
              type: 'Gallery',
              name: 'Dish gallery',
              props: {
                heading: 'A closer look',
                columns: 3,
                images: [
                  {
                    src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Market salad',
                    caption: 'Market salad — $14',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Margherita pizza',
                    caption: 'Margherita pizza — $18',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Grass-fed ribeye',
                    caption: 'Grass-fed ribeye — $38',
                  },
                ],
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Seasonal cooking, honest ingredients, warm hospitality.',
                columns: [
                  {
                    title: 'Visit',
                    links: [
                      { label: 'Menu', href: '/menu' },
                      { label: 'About', href: '/about' },
                      { label: 'Contact', href: '/contact' },
                    ],
                  },
                  {
                    title: 'Hours',
                    links: [
                      { label: 'Mon–Fri: 11am–10pm', href: '#' },
                      { label: 'Sat–Sun: 10am–11pm', href: '#' },
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
                  { label: 'Menu', href: '/menu' },
                  { label: 'About', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_article',
              type: 'Article',
              name: 'Our story',
              props: {
                heading: 'Our story',
                body:
                  '{{appName}} started in 2012 with a simple idea: cook honest food from ingredients we’d be proud to serve our own families.\n\nWe work directly with farmers and producers within 100 miles, and the menu changes with what the season gives us.\n\nEvery plate that leaves the kitchen is made from scratch, by hand, with care. That’s the whole philosophy — and it hasn’t changed in over a decade.',
                author: 'The {{appName}} Team',
                publishedAt: '2026-01-01',
              },
            },
            {
              id: 'comp_stats',
              type: 'Stats',
              name: 'Our numbers',
              props: {
                heading: 'By the numbers',
                items: [
                  { value: '12+', label: 'Years serving', description: 'A neighborhood staple since 2012' },
                  { value: '100 mi', label: 'Local sourcing', description: 'Produce from within 100 miles' },
                  { value: '40+', label: 'Wines by the glass', description: 'Rotating seasonal list' },
                  { value: '25', label: 'Team members', description: 'Chefs, servers, and hosts' },
                ],
              },
            },
            {
              id: 'comp_gallery',
              type: 'Gallery',
              name: 'The team',
              props: {
                heading: 'Meet the team',
                columns: 3,
                images: [
                  {
                    src: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Chef plating a dish',
                    caption: 'Chef de cuisine',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Kitchen team at work',
                    caption: 'The line',
                  },
                  {
                    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Dining room',
                    caption: 'Front of house',
                  },
                ],
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Seasonal cooking, honest ingredients, warm hospitality.',
                columns: [
                  {
                    title: 'Visit',
                    links: [
                      { label: 'Menu', href: '/menu' },
                      { label: 'About', href: '/about' },
                      { label: 'Contact', href: '/contact' },
                    ],
                  },
                  {
                    title: 'Hours',
                    links: [
                      { label: 'Mon–Fri: 11am–10pm', href: '#' },
                      { label: 'Sat–Sun: 10am–11pm', href: '#' },
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
        {
          id: 'page_contact',
          path: '/contact',
          title: 'Contact',
          components: [
            {
              id: 'comp_navbar',
              type: 'Navbar',
              name: 'Main navbar',
              props: {
                logo: '{{appName}}',
                links: [
                  { label: 'Menu', href: '/menu' },
                  { label: 'About', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                ],
                sticky: true,
                transparent: false,
              },
            },
            {
              id: 'comp_contact',
              type: 'ContactForm',
              name: 'Reservations',
              props: {
                heading: 'Book a table',
                subheading: 'Tell us when you’d like to visit and we’ll confirm within the hour.',
                fields: [
                  { name: 'name', label: 'Full name', type: 'text', placeholder: 'Ada Lovelace', required: true },
                  { name: 'email', label: 'Email', type: 'email', placeholder: 'ada@example.com', required: true },
                  { name: 'party', label: 'Party size', type: 'number', placeholder: '2', required: true },
                  { name: 'date', label: 'Preferred date', type: 'text', placeholder: '2026-10-15', required: true },
                  { name: 'message', label: 'Special requests', type: 'text', placeholder: 'Window seat, allergies…', required: false },
                ],
                submitText: 'Request reservation',
              },
            },
            {
              id: 'comp_footer',
              type: 'Footer',
              name: 'Site footer',
              props: {
                brand: '{{appName}}',
                tagline: 'Seasonal cooking, honest ingredients, warm hospitality.',
                columns: [
                  {
                    title: 'Visit',
                    links: [
                      { label: 'Menu', href: '/menu' },
                      { label: 'About', href: '/about' },
                      { label: 'Contact', href: '/contact' },
                    ],
                  },
                  {
                    title: 'Hours',
                    links: [
                      { label: 'Mon–Fri: 11am–10pm', href: '#' },
                      { label: 'Sat–Sun: 10am–11pm', href: '#' },
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
]

/** Look up a built-in starter by id. */
export function getBuiltInTemplate(id: string): BuiltInTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id)
}