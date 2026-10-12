import { describe, it, expect } from 'vitest'
import { generateProject } from '../../src/lib/codegen'
import { indexHead, pageHead, pageMeta, robotsTxt, sitemapXml } from '../../src/lib/codegen/seo'
import type { Page } from '../../src/server/types/schema'

/**
 * SEO emission (WordPress Yoast parity, free): per-page meta becomes real
 * <title>/<meta> tags in the exported site plus sitemap.xml and robots.txt.
 */

function page(overrides: Partial<Page> = {}): Page {
  return {
    id: 'page_home',
    path: '/',
    title: 'Home',
    components: [],
    ...overrides,
  } as Page
}

describe('pageMeta', () => {
  it('returns an empty object when no meta block is set', () => {
    expect(pageMeta(page())).toEqual({})
  })

  it('reads the meta block when present', () => {
    const p = page({ meta: { title: 'Acme', description: 'Desc', noindex: true } })
    expect(pageMeta(p)).toEqual({ title: 'Acme', description: 'Desc', noindex: true })
  })
})

describe('pageHead', () => {
  it('emits title, description, og:image, and noindex when configured', () => {
    const p = page({
      title: 'Fallback',
      meta: { title: 'Acme Home', description: 'A short description', ogImage: 'https://x/og.png', noindex: true },
    })
    const head = pageHead(p)
    expect(head).toContain('<title>Acme Home</title>')
    expect(head).toContain('<meta name="description" content="A short description" />')
    expect(head).toContain('<meta property="og:image" content="https://x/og.png" />')
    expect(head).toContain('<meta name="robots" content="noindex" />')
  })

  it('falls back to the page title and omits unset tags', () => {
    const head = pageHead(page({ title: 'About' }))
    expect(head).toContain('<title>About</title>')
    expect(head).not.toContain('description')
    expect(head).not.toContain('og:image')
    expect(head).not.toContain('robots')
  })

  it('escapes attribute values', () => {
    const p = page({ meta: { title: 'A & B <C>' } })
    expect(pageHead(p)).toContain('<title>A &amp; B &lt;C&gt;</title>')
  })
})

describe('indexHead', () => {
  it('drives index.html from the home page meta', () => {
    const pages = [
      page({ meta: { title: 'Acme', description: 'Home desc', ogImage: 'https://x/og.png' } }),
      page({ id: 'page_about', path: '/about', title: 'About' }),
    ]
    const head = indexHead(pages)
    expect(head).toContain('<title>Acme</title>')
    expect(head).toContain('<meta name="description" content="Home desc" />')
    expect(head).toContain('<meta property="og:image" content="https://x/og.png" />')
  })

  it('defaults to Omix App when no home page exists', () => {
    expect(indexHead([page({ id: 'page_about', path: '/about', title: 'About' })])).toContain(
      '<title>Omix App</title>'
    )
  })
})

describe('sitemapXml', () => {
  it('lists every page except noindex pages', () => {
    const pages = [
      page({ path: '/', title: 'Home' }),
      page({ id: 'page_about', path: '/about', title: 'About' }),
      page({ id: 'page_private', path: '/private', title: 'Private', meta: { noindex: true } }),
    ]
    const xml = sitemapXml(pages)
    expect(xml).toContain('<loc>/</loc>')
    expect(xml).toContain('<loc>/about</loc>')
    expect(xml).not.toContain('/private')
  })
})

describe('robotsTxt', () => {
  it('allows all and points at the sitemap', () => {
    expect(robotsTxt()).toContain('User-agent: *')
    expect(robotsTxt()).toContain('Sitemap: /sitemap.xml')
  })
})

describe('generateProject emits SEO files', () => {
  it('includes sitemap.xml and robots.txt in the generated tree', () => {
    const project = {
      id: 'proj_seo1',
      name: 'SEO Test',
      version: '1.0.0',
      pages: [page({ meta: { title: 'SEO Test', description: 'Desc' } })],
      components: [],
    }
    const files = generateProject(project as never)
    const paths = files.map((f) => f.path)
    expect(paths).toContain('public/sitemap.xml')
    expect(paths).toContain('public/robots.txt')
    const index = files.find((f) => f.path === 'index.html')!.content!
    expect(index).toContain('<title>SEO Test</title>')
    expect(index).toContain('<meta name="description" content="Desc" />')
  })
})
