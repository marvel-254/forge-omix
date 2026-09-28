import type { DesignTokens } from '../../server/types/schema'

/**
 * Design-token code generation (docs/07 §7.4).
 * Tokens become CSS custom properties (`:root` vars) consumed through a
 * Tailwind `theme.extend` mapping, so token edits re-theme generated apps.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isCssValue(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number'
}

function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9_-]/g, '_') || 'token'
}

interface TokenVar {
  name: string
  value: string | number
}

/** Flatten a token group into `--group-path: value` variables. */
export function flattenTokenGroup(
  groupName: string,
  group: unknown,
  prefix = ''
): TokenVar[] {
  if (!isRecord(group)) return []
  const vars: TokenVar[] = []
  for (const [key, value] of Object.entries(group)) {
    const path = prefix ? `${prefix}-${sanitizeSegment(key)}` : sanitizeSegment(key)
    if (isCssValue(value)) {
      vars.push({ name: `--${groupName}-${path}`, value })
    } else if (isRecord(value)) {
      vars.push(...flattenTokenGroup(groupName, value, path))
    }
  }
  return vars
}

/** Collect `:root` variables for every token group. */
export function tokensToCssVars(tokens?: DesignTokens | null): TokenVar[] {
  if (!tokens) return []
  const groups: Array<[string, unknown]> = [
    ['color', (tokens as Record<string, unknown>).colors],
    ['font', (tokens as Record<string, unknown>).typography],
    ['spacing', (tokens as Record<string, unknown>).spacing],
    ['radius', (tokens as Record<string, unknown>).radius],
    ['shadow', (tokens as Record<string, unknown>).shadows],
    ['breakpoint', (tokens as Record<string, unknown>).breakpoints],
    ['motion', (tokens as Record<string, unknown>).motion],
    ['z', (tokens as Record<string, unknown>).zIndex],
  ]
  return groups.flatMap(([groupName, group]) => flattenTokenGroup(groupName, group))
}

export function generateTokensCss(tokens?: DesignTokens | null): string {
  const vars = tokensToCssVars(tokens)
  if (vars.length === 0) return ':root {\n}\n'
  const lines = vars.map(({ name, value }) => `  ${name}: ${value};`)
  return `:root {\n${lines.join('\n')}\n}\n`
}

/**
 * Tailwind `theme.extend` snippet referencing the CSS variables, so the
 * generated app inherits token values at runtime.
 */
export function generateTailwindExtend(tokens?: DesignTokens | null): string {
  const vars = tokensToCssVars(tokens)
  const byGroup = new Map<string, TokenVar[]>()
  for (const v of vars) {
    const group = v.name.replace(/^--/, '').split('-')[0]
    const list = byGroup.get(group) ?? []
    list.push(v)
    byGroup.set(group, list)
  }
  const sections: string[] = []
  const pick = (group: string) => (byGroup.get(group) ?? []).slice(0, 12)
  const colorEntries = pick('color').map((v) => {
    const key = v.name.replace(/^--color-/, '')
    return `          ${JSON.stringify(key)}: 'var(${v.name})',`
  })
  if (colorEntries.length > 0) {
    sections.push(`      colors: {\n${colorEntries.join('\n')}\n      },`)
  }
  const fontEntries = pick('font').map((v) => {
    const key = v.name.replace(/^--font-/, '')
    return `          ${JSON.stringify(key)}: 'var(${v.name})',`
  })
  if (fontEntries.length > 0) {
    sections.push(`      fontFamily: {\n${fontEntries.join('\n')}\n      },`)
  }
  const spacingEntries = pick('spacing').map((v) => {
    const key = v.name.replace(/^--spacing-/, '')
    return `          ${JSON.stringify(key)}: 'var(${v.name})',`
  })
  if (spacingEntries.length > 0) {
    sections.push(`      spacing: {\n${spacingEntries.join('\n')}\n      },`)
  }
  if (sections.length === 0) return '    extend: {},'
  return `    extend: {\n${sections.join('\n')}\n    },`
}
