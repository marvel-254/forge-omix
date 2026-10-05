/**
 * Uploaded-media URL helpers shared by both export paths (docs/17).
 *
 * The editor hands out `/api/media/files/<storedName>` URLs, which only
 * resolve against a running forge@omix server. An exported site is a static
 * bundle served by someone else's host, so those URLs would 404 for every
 * visitor. Export rewrites them to a bundled copy under `public/assets/`.
 *
 * Deliberately free of Node imports: the editor's CodeModal runs this in the
 * browser, so nothing here may pull in `node:fs`.
 */

/** Where uploaded assets land inside a generated project. */
export const ASSET_DIR = 'public/assets'

/**
 * Vite serves `public/` at the site root, so an asset written to
 * `public/assets/<name>` is referenced as `/assets/<name>`. Derived from the
 * file path so the written location and the emitted URL cannot drift apart.
 */
export function assetUrl(path: string): string {
  return `/${path.replace(/^public\//, '')}`
}

/** Matches the served URL shape produced by mediaService/routes. */
const MEDIA_URL = /^\/api\/media\/files\/([A-Za-z0-9._-]+)$/

/** The stored name inside a served media URL, or null if it is not one. */
export function storedNameOf(url: string): string | null {
  return MEDIA_URL.exec(url)?.[1] ?? null
}

/**
 * Every uploaded-media URL reachable from a project payload, deduplicated.
 *
 * Walks the whole payload rather than known prop paths: a media URL can sit
 * in `src`, `poster`, a gallery `images[].src`, or a responsive override, and
 * missing a case here is a silently broken image in the exported site.
 */
export function collectMediaUrls(project: unknown): string[] {
  const found: string[] = []
  const seen = new Set<string>()

  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      if (storedNameOf(node) && !seen.has(node)) {
        seen.add(node)
        found.push(node)
      }
      return
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    if (node && typeof node === 'object') {
      for (const value of Object.values(node)) walk(value)
    }
  }

  walk(project)
  return found
}

/**
 * Deep-rewrite uploaded-media URLs in a payload, reporting each distinct
 * stored name it resolved. Returns a new payload; the input is not mutated.
 *
 * `resolve` maps a stored name to the URL to emit — a bundled asset path, or
 * `null` to leave that reference untouched (the asset is gone).
 */
export function rewriteMediaUrls<T>(
  project: T,
  resolve: (storedName: string) => string | null
): { project: T; resolved: string[] } {
  const names: string[] = []
  const seen = new Set<string>()

  const rewrite = (node: unknown): unknown => {
    if (typeof node === 'string') {
      const storedName = storedNameOf(node)
      if (!storedName) return node
      if (!seen.has(storedName)) {
        seen.add(storedName)
        names.push(storedName)
      }
      return resolve(storedName) ?? node
    }
    if (Array.isArray(node)) return node.map(rewrite)
    if (node && typeof node === 'object') {
      const out: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(node)) out[key] = rewrite(value)
      return out
    }
    return node
  }

  return { project: rewrite(project) as T, resolved: names }
}