/**
 * Output escaping for generated code (docs/07 §7.3).
 * User-authored strings (labels, titles, content) must never break out of
 * the generated JSX/attributes.
 */

/** Escape a string for use as JSX text content. */
export function escText(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
}

/** Escape a string for use inside a double-quoted JSX attribute. */
export function escAttr(value: unknown): string {
  return escText(value).replace(/"/g, '&quot;')
}

/** Emit a JS string literal (for props objects, JSON-ish data). */
export function jsString(value: unknown): string {
  return JSON.stringify(String(value ?? ''))
}
