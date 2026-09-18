/**
 * Design-token → CSS-variable theming for the canvas.
 *
 * The UI kit (components/ui) uses shadcn semantic classes (bg-primary,
 * bg-card, border-input, …) backed by CSS variables (index.css). This module
 * maps a project's designTokens onto those variables so the whole canvas
 * rethemes at once. Only token-provided values are overridden; everything
 * else keeps its default. Pure and side-effect-free for easy unit testing.
 */
export type TokenCssVars = Record<string, string>

/** Token color role → shadcn variables (RGB triplets). */
const COLOR_MAP: Record<string, string[]> = {
  background: ['--background'],
  surface: ['--card'],
  primary: ['--primary', '--ring'],
  secondary: ['--secondary'],
  accent: ['--accent'],
  error: ['--destructive'],
  border: ['--input', '--border'],
}

/** Foreground defaults for roles that fill a background. */
const FG_MAP: Record<string, string> = {
  '--primary': '255 255 255',
  '--secondary': '15 23 42',
  '--accent': '15 23 42',
  '--destructive': '255 255 255',
  '--card': '15 23 42',
}

/** Text token roles → variables. */
const TEXT_MAP: Record<string, string> = {
  primary: '--foreground',
  secondary: '--muted-foreground',
}

/** Map tokens.colors + tokens.typography onto CSS variables. */
export function buildTokenCssVars(designTokens: unknown): TokenCssVars {
  const vars: TokenCssVars = {}
  if (!designTokens || typeof designTokens !== 'object') return vars
  const tokens = designTokens as Record<string, unknown>

  const colors = tokens.colors
  if (colors && typeof colors === 'object') {
    const record = colors as Record<string, unknown>

    for (const [role, names] of Object.entries(COLOR_MAP)) {
      const triplet = toTriplet(record[role])
      if (!triplet) continue
      for (const name of names) {
        vars[name] = triplet
        const fg = FG_MAP[name]
        if (fg) vars[`${name}-foreground`] = fg
      }
    }

    const text = record.text
    if (text && typeof text === 'object') {
      const textRecord = text as Record<string, unknown>
      for (const [role, name] of Object.entries(TEXT_MAP)) {
        const triplet = toTriplet(textRecord[role])
        if (triplet) vars[name] = triplet
      }
    }
  }

  const typography = tokens.typography
  if (typography && typeof typography === 'object') {
    const typo = typography as Record<string, unknown>
    if (typeof typo.fontFamily === 'string' && typo.fontFamily.trim()) {
      vars['--omix-font-family'] = typo.fontFamily.trim()
    }
  }

  return vars
}

/** Convert a token color value (#rgb/#rrggbb/rgb()/rgba()) to `r g b`. */
function toTriplet(value: unknown): string | null {
  const hex = normalizeColor(value)
  return hex ? hexToRgbTriplet(hex).join(' ') : null
}

/** Accepts #rgb/#rrggbb or rgb()/rgba() strings; returns normalized #rrggbb. */
export function normalizeColor(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return expandShortHex(v)
  const rgb = v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (rgb) {
    const [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])].map((n) =>
      Math.min(255, n)
    )
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
  }
  return null
}

function expandShortHex(v: string): string {
  const [, r, g, b] = v
  return `#${r}${r}${g}${g}${b}${b}`
}

/** Convert a normalized #rrggbb to an `r g b` triplet string. */
export function hexToRgbTriplet(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}
