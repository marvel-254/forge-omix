import { useState } from 'react'
import { useSchemaStore } from '../../store/schemaStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

/**
 * Per-page SEO editor (WordPress Yoast parity, free).
 *
 * Edits the `meta` block on the active page — title, description, social
 * image, and noindex — which the code generator emits as real <title> and
 * <meta> tags plus sitemap.xml/robots.txt entries. Everything WordPress
 * charges for with SEO plugins is built in.
 */
export function SeoPanel() {
  const project = useSchemaStore((s) => s.project)
  const activePageId = useSchemaStore((s) => s.activePageId)
  const updateProject = useSchemaStore((s) => s.actions.updateProject)
  const [saved, setSaved] = useState(false)

  const page = project?.pages.find((p) => p.id === activePageId)
  if (!project || !page) return null

  const meta = (page.meta ?? {}) as Record<string, unknown>
  const title = typeof meta.title === 'string' ? meta.title : ''
  const description = typeof meta.description === 'string' ? meta.description : ''
  const ogImage = typeof meta.ogImage === 'string' ? meta.ogImage : ''
  const noindex = meta.noindex === true

  const patch = (updates: Record<string, unknown>) => {
    const pages = project.pages.map((p) =>
      p.id === page.id ? { ...p, meta: { ...meta, ...updates } } : p
    )
    updateProject({ pages })
    setSaved(false)
  }

  const handleSave = () => {
    updateProject({ pages: project.pages })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4 p-4" data-testid="seo-panel">
      <div>
        <h2 className="text-sm font-semibold text-foreground">SEO</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Search and social preview for <span className="font-medium text-foreground">{page.path}</span>.
          Emitted as real meta tags in the exported site.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground" htmlFor="seo-title">
          Meta title
        </label>
        <Input
          id="seo-title"
          value={title}
          placeholder={page.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">
          {title.length || page.title.length}/60 characters recommended
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground" htmlFor="seo-desc">
          Meta description
        </label>
        <textarea
          id="seo-desc"
          value={description}
          placeholder="A short, compelling summary shown under the title in search results."
          onChange={(e) => patch({ description: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <p className="text-[11px] text-muted-foreground">
          {description.length}/160 characters recommended
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground" htmlFor="seo-og">
          Social share image URL
        </label>
        <Input
          id="seo-og"
          value={ogImage}
          placeholder="https://example.com/og.png"
          onChange={(e) => patch({ ogImage: e.target.value })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={noindex}
          onChange={(e) => patch({ noindex: e.target.checked })}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <span>Hide from search engines (noindex)</span>
      </label>

      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Preview
        </p>
        <p className="mt-1 truncate text-sm font-medium text-foreground">
          {title || page.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-emerald-600">
          {page.path}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {description || 'Add a meta description to control how this page appears in search results.'}
        </p>
      </div>

      <Button size="sm" onClick={handleSave} className="w-full">
        {saved ? 'Saved ✓' : 'Save SEO'}
      </Button>
    </div>
  )
}
