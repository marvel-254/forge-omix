import { describe, it, expect } from 'vitest'
import { escAttr, escText, jsString } from '@/lib/codegen/escape'
import { generateTailwindExtend, generateTokensCss, tokensToCssVars } from '@/lib/codegen/tokens'
import { generateComponentJSX } from '@/lib/codegen/components'
import { generateAppFile, generatePageFile, pageComponentName } from '@/lib/codegen/pages'
import { generateProject, slugify } from '@/lib/codegen/project'
import type { Component, DesignTokens, Page } from '@/server/types/schema'

const tokens = {
  colors: { primary: '#3B82F6', secondary: { light: '#93c5fd' } },
  spacing: { md: '1rem' },
} as unknown as DesignTokens

const button = {
  id: 'comp_btn1',
  type: 'Button',
  props: { label: 'Click <me>', variant: 'primary', size: 'md' },
} as unknown as Component

describe('escaping', () => {
  it('escapes JSX text and attributes', () => {
    expect(escText('<b>{x}</b>')).toBe('&lt;b&gt;&#123;x&#125;&lt;/b&gt;')
    expect(escAttr('say "hi"')).toBe('say &quot;hi&quot;')
  })

  it('emits safe JS string literals', () => {
    expect(jsString(`a'b"c`)).toBe(`"a'b\\"c"`)
  })
})

describe('tokensToCssVars / generateTokensCss', () => {
  it('flattens nested groups', () => {
    const vars = tokensToCssVars(tokens)
    expect(vars).toContainEqual({ name: '--color-primary', value: '#3B82F6' })
    expect(vars).toContainEqual({ name: '--color-secondary-light', value: '#93c5fd' })
    expect(vars).toContainEqual({ name: '--spacing-md', value: '1rem' })
  })

  it('emits a :root block', () => {
    const css = generateTokensCss(tokens)
    expect(css.startsWith(':root {')).toBe(true)
    expect(css).toContain('--color-primary: #3B82F6;')
  })

  it('handles missing tokens', () => {
    expect(generateTokensCss(null)).toBe(':root {\n}\n')
    expect(generateTailwindExtend(undefined)).toBe('    extend: {},')
  })

  it('maps colors to var() references', () => {
    const extend = generateTailwindExtend(tokens)
    expect(extend).toContain(`'var(--color-primary)'`)
  })
})

describe('generateComponentJSX', () => {
  it('emits a Button with escaped label', () => {
    const { jsx, needsNavigate } = generateComponentJSX(button, { tokens }, 'w0')
    expect(jsx).toContain('<Button variant="primary" size="md">')
    expect(jsx).toContain('Click &lt;me&gt;')
    expect(needsNavigate).toBe(false)
  })

  it('emits navigate handlers and flags the page', () => {
    const comp = {
      id: 'comp_nav1',
      type: 'Button',
      props: { label: 'Go' },
      interactions: { onClick: { type: 'navigate', target: '/dash' } },
    } as unknown as Component
    const { jsx, needsNavigate } = generateComponentJSX(comp, {}, 'w0')
    expect(jsx).toContain('onClick={() => navigate("/dash")}')
    expect(needsNavigate).toBe(true)
  })

  it('emits style and a11y attributes', () => {
    const comp = {
      id: 'comp_card1',
      type: 'Card',
      props: { header: 'Hi' },
      styles: { base: { color: { $ref: 'designTokens.colors.primary' } } },
      accessibility: { role: 'region', label: 'Intro' },
    } as unknown as Component
    const { jsx } = generateComponentJSX(comp, { tokens }, 'w0')
    expect(jsx).toContain('style={{ color: "#3B82F6" }}')
    expect(jsx).toContain('role="region"')
    expect(jsx).toContain('aria-label="Intro"')
  })

  it('emits responsive hooks for hidden + overrides', () => {
    const comp = {
      id: 'comp_btn2',
      type: 'Button',
      props: { label: 'Go', size: 'md' },
      responsive: [
        { breakpoint: 'sm', hidden: true },
        { breakpoint: 'lg', props: { size: 'lg' } },
      ],
    } as unknown as Component
    const { hooks, jsx } = generateComponentJSX(comp, {}, 'w0')
    expect(hooks.join('\n')).toContain('useResponsiveHidden({"sm":true})')
    expect(hooks.join('\n')).toContain(
      'useResponsiveProps({"size":"md"} as Record<string, unknown>, {"lg":{"size":"lg"}} as Record<string, Record<string, unknown>>)'
    )
    expect(jsx).toContain('{!w0H && (')
    expect(jsx).toContain('{w0R.size as')
  })

  it('converts row-format chart data', () => {
    const comp = {
      id: 'comp_chart1',
      type: 'Chart',
      props: {
        type: 'bar',
        chartLabels: ['Q1', 'Q2'],
        datasets: [{ label: 'Revenue', values: '12, 30' }],
      },
    } as unknown as Component
    const { jsx } = generateComponentJSX(comp, {}, 'w0')
    expect(jsx).toContain('<Chart type="bar"')
    expect(jsx).toContain('"labels":["Q1","Q2"]')
    expect(jsx).toContain('"data":[12,30]')
  })

  it('emits valid links for empty navbar link lists', () => {
    const comp = {
      id: 'comp_nav1',
      type: 'Navbar',
      props: { logo: 'L', links: [] },
    } as unknown as Component
    const { jsx } = generateComponentJSX(comp, {}, 'w0')
    expect(jsx).toContain('links={[]}')
    expect(jsx).not.toContain('links=[]')
  })

  it('casts hook-backed scalar props for strict TS', () => {
    const comp = {
      id: 'comp_input1',
      type: 'Input',
      props: { label: 'Name' },
      responsive: [{ breakpoint: 'md', props: { label: 'Full name' } }],
    } as unknown as Component
    const { jsx } = generateComponentJSX(comp, {}, 'w0')
    expect(jsx).toContain('label={w0R.label as string}')
  })

  it('uses unique hook variables per component instance', () => {
    const card = (id: string) =>
      ({
        id,
        type: 'Card',
        props: { header: 'H' },
        responsive: [{ breakpoint: 'lg', props: { header: 'B' } }],
      }) as unknown as Component
    const first = generateComponentJSX(card('comp_a1'), {}, 'w0')
    const second = generateComponentJSX(card('comp_a2'), {}, 'w1')
    expect(first.hooks.join('\n')).toContain('const w0R =')
    expect(second.hooks.join('\n')).toContain('const w1R =')
    expect(second.hooks.join('\n')).not.toContain('const w0R =')
    expect(second.jsx).toContain('{w1R.header as string}')
  })

  it('falls back for unknown types', () => {
    const comp = { id: 'comp_z9', type: 'Nope', props: {} } as unknown as Component
    const { jsx } = generateComponentJSX(comp, {}, 'w0')
    expect(jsx).toContain('Unsupported component type: Nope')
  })
})

describe('pages', () => {
  it('derives unique component names', () => {
    const taken = new Set<string>()
    const home = { path: '/', title: 'Home' } as Page
    expect(pageComponentName(home, taken)).toBe('HomePage')
    expect(pageComponentName({ path: '/', title: 'Home' } as Page, taken)).toBe('HomePage2')
    expect(pageComponentName({ path: '/dashboard', title: '' } as Page, taken)).toBe(
      'DashboardPage'
    )
  })

  it('generates a page file with imports and hooks', () => {
    const page = {
      id: 'page_home',
      path: '/',
      title: 'Home',
      components: [button],
    } as unknown as Page
    const file = generatePageFile(page, { tokens }, 'HomePage')
    expect(file.filePath).toBe('src/pages/HomePage.tsx')
    expect(file.code).toContain('export function HomePage()')
    expect(file.code).toContain("from '../components/ui'")
  })

  it('generates routes in App', () => {
    const app = generateAppFile([
      { path: '/', componentName: 'HomePage' },
      { path: '/dashboard', componentName: 'DashboardPage' },
    ])
    expect(app).toContain('<Route path="/" element={<HomePage />} />')
    expect(app).toContain("from './pages/DashboardPage'")
  })
})

describe('codegen performance budget (docs/12 §12.1)', () => {
  it('generates a 10-page project in under 5 seconds', () => {
    const big = {
      id: 'proj_big1234',
      name: 'Big',
      version: '1.0.0',
      pages: Array.from({ length: 10 }, (_, p) => ({
        id: `page_p${p}`,
        path: p === 0 ? '/' : `/p${p}`,
        title: `Page ${p}`,
        components: Array.from({ length: 20 }, (_, c) => ({
          id: `comp_p${p}c${c}`,
          type: ['Button', 'Input', 'Card', 'Navbar', 'Chart', 'Table'][c % 6],
          props: { label: `Item ${c}` },
        })),
      })),
      components: [],
    } as unknown as Parameters<typeof generateProject>[0]
    const started = Date.now()
    const files = generateProject(big)
    expect(Date.now() - started).toBeLessThan(5000)
    expect(files.length).toBeGreaterThan(20)
  })
})

describe('generateProject', () => {
  const project = {
    id: 'proj_demo',
    name: 'Demo App',
    version: '1.0.0',
    pages: [
      {
        id: 'page_home',
        path: '/',
        title: 'Home',
        components: [button],
      },
    ],
    components: [],
    designTokens: tokens,
  } as unknown as Parameters<typeof generateProject>[0]

  it('emits the full file tree', () => {
    const paths = generateProject(project).map((f) => f.path)
    for (const expected of [
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      'index.html',
      'tailwind.config.js',
      'src/index.css',
      'src/main.tsx',
      'src/components/ui.tsx',
      'src/lib/responsive.tsx',
      'src/App.tsx',
      'src/pages/HomePage.tsx',
      'README.md',
      'AGENTS.md',
    ]) {
      expect(paths).toContain(expected)
    }
  })

  it('emits a valid package.json with runtime deps', () => {
    const files = generateProject(project)
    const pkg = JSON.parse(files.find((f) => f.path === 'package.json')!.content)
    expect(pkg.name).toBe('demo-app')
    expect(pkg.dependencies['react-router-dom']).toBeDefined()
    expect(pkg.dependencies['chart.js']).toBeDefined()
  })

  it('bakes tokens into CSS and Tailwind config', () => {
    const files = generateProject(project)
    const css = files.find((f) => f.path === 'src/index.css')!.content
    expect(css).toContain('--color-primary: #3B82F6;')
    const tw = files.find((f) => f.path === 'tailwind.config.js')!.content
    expect(tw).toContain('var(--color-primary)')
  })

  it('slugifies names', () => {
    expect(slugify('My Cool App!')).toBe('my-cool-app')
    expect(slugify('')).toBe('omix-app')
  })
})
