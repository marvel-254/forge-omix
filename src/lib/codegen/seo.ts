import type { Page } from '../../server/types/schema'

/**
 * SEO emission for generated sites (WordPress Yoast parity, free).
 *
 * Each page's `meta` block (title, description, ogImage, noindex) becomes
 * real <title>/<meta> tags in the exported HTML plus entries in
 * sitemap.xml and robots.txt. The home page's meta drives index.html; every
 * page's meta is emitted into its own component via a <head> helper.
 */

export interface PageMeta {
  title?: string
  description?: string
  ogImage?: string
  noindex?: boolean
}

/** The page's SEO meta block, or an empty object when unset. */
export function pageMeta(page: Page): PageMeta {
  const meta = (page as unknown as { meta?: unknown }).meta
  return meta && typeof meta === 'object' ? (meta as PageMeta) : {}
}

/** Escape a string for use inside an HTML attribute value. */
function escAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** The <title> for a page: explicit meta title, else the page title. */
export function pageTitle(page: Page): string {
  const meta = pageMeta(page)
  return meta.title?.trim() || (typeof page.title === 'string' ? page.title : '')
}

/**
 * The <head> block a page component renders. Emits the page title, meta
 * description, Open Graph tags, and a noindex robots rule when configured.
 */
export function pageHead(page: Page): string {
  const meta = pageMeta(page)
  const title = pageTitle(page)
  const parts: string[] = []
  if (title) parts.push(`<title>${escAttr(title)}</title>`)
  if (meta.description) {
    parts.push(`<meta name="description" content="${escAttr(meta.description)}" />`)
  }
  if (meta.ogImage) {
    parts.push(`<meta property="og:image" content="${escAttr(meta.ogImage)}" />`)
  }
  if (meta.noindex) {
    parts.push(`<meta name="robots" content="noindex" />`)
  }
  return parts.join('\n    ')
}

/** The <head> block for index.html, driven by the home page's meta. */
export function indexHead(pages: Page[]): string {
  const home = pages.find((p) => (p as unknown as { path?: string }).path === '/')
  const meta = home ? pageMeta(home) : {}
  const title = home ? pageTitle(home) : 'Omix App'
  const parts = [
    `<meta charset="UTF-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    `<title>${escAttr(title)}</title>`,
  ]
  if (meta.description) {
    parts.push(`<meta name="description" content="${escAttr(meta.description)}" />`)
  }
  if (meta.ogImage) {
    parts.push(`<meta property="og:image" content="${escAttr(meta.ogImage)}" />`)
  }
  return parts.join('\n    ')
}

/** sitemap.xml for the generated site, one <url> per page. */
export function sitemapXml(pages: Page[]): string {
  const urls = pages
    .map((page) => {
      const path = (page as unknown as { path?: string }).path ?? '/'
      const meta = pageMeta(page)
      if (meta.noindex) return ''
      return `  <url>\n    <loc>${escAttr(path)}</loc>\n  </url>`
    })
    .filter(Boolean)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** robots.txt for the generated site. */
export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml\n`
}
