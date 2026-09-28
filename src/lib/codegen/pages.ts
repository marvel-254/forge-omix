import type { Component, Page } from '../../server/types/schema'
import { generateComponentJSX, type ComponentGenContext } from './components'
import { escAttr } from './escape'

/**
 * Page + route generation (docs/07 §7.5, React + Vite target).
 */

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function componentTypeOf(component: Component): string {
  return String(asRecord(component).type ?? '')
}

function componentChildren(component: Component): Component[] {
  const children = asRecord(component).children
  return Array.isArray(children) ? (children as Component[]) : []
}

export interface GeneratedPage {
  /** e.g. `HomePage` — also the exported component name. */
  componentName: string
  /** e.g. `src/pages/HomePage.tsx`. */
  filePath: string
  code: string
}

function toPascal(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
  const pascal = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  return pascal || 'Page'
}

/** Derive a unique page component name from path/title. */
export function pageComponentName(page: Page, taken: Set<string>): string {
  const path = typeof page.path === 'string' ? page.path : '/'
  const fallback = path === '/' ? 'Home' : path.split('/').filter(Boolean).pop() ?? 'Page'
  const base = `${toPascal(typeof page.title === 'string' && page.title ? page.title : fallback)}Page`
  let name = base
  let n = 2
  while (taken.has(name)) {
    name = `${base}${n}`
    n += 1
  }
  taken.add(name)
  return name
}

interface TreeResult {
  hooks: string[]
  jsx: string
  needsNavigate: boolean
}

function generateTree(
  component: Component,
  ctx: ComponentGenContext,
  scope: string
): TreeResult {
  const children = componentChildren(component).map((child, i) =>
    generateTree(child, ctx, `${scope}c${i}`)
  )
  const childHooks = children.flatMap((c) => c.hooks)
  const childJSX = children.map((c) => c.jsx).join('\n      ')
  const self = generateComponentJSX(component, ctx, scope, childJSX)
  const needsNavigate =
    self.needsNavigate || children.some((c) => c.needsNavigate)
  // Only Card nests children; siblings render after all other kinds.
  const jsx =
    componentTypeOf(component) === 'Card'
      ? self.jsx
      : [self.jsx, ...children.map((c) => c.jsx)].join('\n      ')
  return { hooks: [...childHooks, ...self.hooks], jsx, needsNavigate }
}

export function generatePageFile(
  page: Page,
  ctx: ComponentGenContext,
  componentName: string
): GeneratedPage {
  const components = Array.isArray(page.components) ? page.components : []
  const trees = components.map((component, i) => generateTree(component, ctx, `w${i}`))
  const hooks = trees.flatMap((t) => t.hooks)
  const needsNavigate = trees.some((t) => t.needsNavigate)
  const needsResponsive = hooks.some((h) => h.includes('useResponsive'))
  const body = trees.map((t) => t.jsx).join('\n      ') || '{/* Empty page */}'

  const imports = [
    `import { ${['Button', 'Input', 'Card', 'Navbar', 'Chart', 'Table'].join(', ')} } from '../components/ui';`,
  ]
  if (needsNavigate) imports.push(`import { useNavigate } from 'react-router-dom';`)
  if (needsResponsive) {
    imports.push(
      `import { useResponsiveProps, useResponsiveHidden } from '../lib/responsive';`
    )
  }

  const navigateDecl = needsNavigate ? `\n  const navigate = useNavigate();` : ''
  const hooksBlock = hooks.length > 0 ? `\n${hooks.join('\n')}` : ''

  const code = `${imports.join('\n')}

export function ${componentName}() {${navigateDecl}${hooksBlock}
  return (
    <div data-page="${escAttr(componentName)}" data-title="${escAttr(page.title ?? componentName)}">
      ${body}
    </div>
  );
}
`
  return { componentName, filePath: `src/pages/${componentName}.tsx`, code }
}

/** `src/App.tsx` with one `<Route>` per page (react-router-dom v7). */
export function generateAppFile(pages: Array<{ path: string; componentName: string }>): string {
  const imports = pages.map(
    ({ componentName }) => `import { ${componentName} } from './pages/${componentName}';`
  )
  const routes = pages.map(
    ({ path, componentName }) =>
      `        <Route path=${JSON.stringify(path)} element={<${componentName} />} />`
  )
  return `import { BrowserRouter, Routes, Route } from 'react-router-dom';
${imports.join('\n')}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
${routes.join('\n')}
      </Routes>
    </BrowserRouter>
  );
}
`
}
