import { useCallback, useMemo, useState } from 'react'
import { useSchemaStore } from '../store/schemaStore'
import { Canvas } from '../canvas/Canvas'
import ComponentLibrary from '../components/library/ComponentLibrary'
import { PropertiesPanel } from '../panels/PropertiesPanel'
import { LayersPanel } from '../panels/LayersPanel'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import type { ComponentType } from '../components/library'
import { defaultPropsFor } from '../canvas/registry'
import type { Component, Page } from '@client/types/schema'

type PanelTab = 'properties' | 'layers'

/**
 * Top-level builder layout: header, pages sidebar, canvas, and
 * context panels (docs/04 §4.3 Canvas Shell).
 */
export function EditorShell() {
  const project = useSchemaStore((s) => s.project)
  const activePageId = useSchemaStore((s) => s.activePageId)
  const saveState = useSchemaStore((s) => s.saveState)
  const saveError = useSchemaStore((s) => s.saveError)
  const loadProject = useSchemaStore((s) => s.actions.loadProject)
  const loadFromServer = useSchemaStore((s) => s.loadFromServer)
  const saveToServer = useSchemaStore((s) => s.saveToServer)
  const createProjectOnServer = useSchemaStore((s) => s.actions.createProjectOnServer)
  const addPage = useSchemaStore((s) => s.actions.addPage)
  const setActivePage = useSchemaStore((s) => s.actions.setActivePage)
  const removePage = useSchemaStore((s) => s.actions.removePage)
  const addComponentToPage = useSchemaStore((s) => s.actions.addComponentToPage)

  // Viewport is persisted per project (project.settings.editor); panel tab
  // and the new-page input stay as ephemeral local state.
  const editorPrefs = useSchemaStore((s) => s.editorPrefs)
  const setEditorPrefs = useSchemaStore((s) => s.setEditorPrefs)
  const viewport = editorPrefs.viewport
  const setViewport = useCallback(
    (v: 'desktop' | 'tablet' | 'mobile') => setEditorPrefs({ viewport: v }),
    [setEditorPrefs]
  )
  const [panelTab, setPanelTab] = useState<PanelTab>('properties')
  const [newPagePath, setNewPagePath] = useState('')

  const handleAddComponent = useCallback(
    (type: ComponentType) => {
      const component = {
        id: 'comp_' + Math.random().toString(36).slice(2, 10),
        type,
        props: defaultPropsFor(type),
      } as unknown as Component
      addComponentToPage(component)
    },
    [addComponentToPage]
  )

  const handleAddPage = useCallback(() => {
    const base = newPagePath.trim() || 'page'
    const slug = base.startsWith('/') ? base.slice(1) : base
    const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, '') || 'page'
    addPage({
      id: 'page_' + safeSlug + '_' + Math.random().toString(36).slice(2, 6),
      path: '/' + safeSlug,
      title: safeSlug.charAt(0).toUpperCase() + safeSlug.slice(1),
      components: [],
    } as unknown as Page)
  }, [addPage, newPagePath])

  const handleSave = useCallback(async () => {
    await saveToServer()
  }, [saveToServer])

  const handleOpenProject = useCallback(
    async (projectId: string) => {
      await loadFromServer(projectId.trim())
    },
    [loadFromServer]
  )

  const handleExport = useCallback(async () => {
    if (!project) return
    // Sync to the server before exporting so the downloaded JSON matches the
    // server's persisted state (creates the project server-side if needed).
    await saveToServer()
    const payload = {
      $schema: 'https://forge-omix.io/schemas/project.schema.json',
      format: 'forge-omix-export',
      exportedAt: new Date().toISOString(),
      project,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${project.id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [project, saveToServer])

  const pages = useMemo(() => project?.pages ?? [], [project])

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">forge@omix</h1>
          <p className="text-neutral-600 mb-6">
            AI-native visual software builder
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => void createProjectOnServer()}>Create new project</Button>
            <label className="inline-block">
              <span className="sr-only">Import project JSON</span>
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const text = await file.text()
                    const parsed = JSON.parse(text)
                    // Accept both raw projects and the export envelope
                    const candidate = parsed?.project ?? parsed
                    const result = loadProject(candidate)
                    if (!result.valid) {
                      alert('Invalid project file: schema validation failed')
                    }
                  } catch {
                    alert('Could not parse the selected file as JSON')
                  }
                }}
              />
              <span className="inline-flex cursor-pointer items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50">
                Import JSON
              </span>
            </label>
          </div>
          <form
            className="mt-4 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const input = e.currentTarget.elements.namedItem('projectId')
              if (input instanceof HTMLInputElement && input.value.trim()) {
                void handleOpenProject(input.value)
              }
            }}
          >
            <Input name="projectId" placeholder="Open project ID (proj_…)" />
            <Button type="submit" size="sm" variant="outline">
              Open
            </Button>
          </form>
          {saveState === 'error' && saveError && (
            <p className="mt-2 text-xs text-red-600">{saveError}</p>
          )}
          <p className="mt-1 text-xs text-neutral-400">
            Projects are saved to the API when the server is reachable; otherwise they stay local.
          </p>
          <p className="mt-4 text-xs text-neutral-400">
            Exports match the universal schema (schemas/project.schema.json).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2 bg-white border-b">
        <span className="font-semibold text-neutral-900">forge@omix</span>
        <span className="text-neutral-300">|</span>
        <span className="text-sm text-neutral-500 truncate max-w-[240px]">
          {project.name}
        </span>          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-neutral-400">v{project.version}</span>
            <span
              className="text-xs text-neutral-500"
              title={saveError ?? undefined}
            >
              {saveState === 'saving' && 'Saving…'}
              {saveState === 'saved' && '✓ Saved'}
              {saveState === 'error' && 'Save failed'}
            </span>
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saveState === 'saving'}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              Export
            </Button>
          </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar: pages + component library */}
        <aside className="w-64 shrink-0 border-r bg-white flex flex-col min-h-0">
          <div className="px-3 pt-3 pb-2 border-b">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
              Pages
            </h2>
            <ul className="space-y-1">
              {pages.map((p) => (
                <li key={p.id} className="flex items-center gap-1 group">
                  <button
                    type="button"
                    onClick={() => setActivePage(p.id)}
                    aria-pressed={p.id === activePageId}
                    className={`flex-1 text-left px-2 py-1.5 rounded text-sm transition-colors ${
                      p.id === activePageId
                        ? 'bg-primary-100 text-primary-900 font-medium'
                        : 'hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <span className="text-neutral-400 mr-2">{p.path}</span>
                    {p.title}
                  </button>
                  {pages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete page ${p.title}`}
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => removePage(p.id)}
                    >
                      ✕
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-1">
              <Input
                value={newPagePath}
                placeholder="/about"
                onChange={(e) => setNewPagePath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPage()
                }}
              />
              <Button size="sm" onClick={handleAddPage} aria-label="Add page">
                +
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <ComponentLibrary onSelectComponent={handleAddComponent} />
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <Canvas viewport={viewport} onViewportChange={setViewport} />

        {/* Right sidebar: panels */}
        <aside className="w-72 shrink-0 border-l bg-white flex flex-col min-h-0">
          <div className="flex border-b">
            {(['properties', 'layers'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPanelTab(tab)}
                aria-pressed={panelTab === tab}
                className={`flex-1 px-3 py-2 text-sm capitalize transition-colors ${
                  panelTab === tab
                    ? 'border-b-2 border-primary-500 text-primary-700 font-medium'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {panelTab === 'properties' ? <PropertiesPanel /> : <LayersPanel />}
          </div>
          <div className="border-t p-2">
            <ViewportSwitcher viewport={viewport} onChange={setViewport} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function ViewportSwitcher({
  viewport,
  onChange,
}: {
  viewport: 'desktop' | 'tablet' | 'mobile'
  onChange: (v: 'desktop' | 'tablet' | 'mobile') => void
}) {
  return (
    <div className="flex gap-1">
      {(['desktop', 'tablet', 'mobile'] as const).map((vp) => (
        <Button
          key={vp}
          size="sm"
          variant={viewport === vp ? 'default' : 'outline'}
          aria-pressed={viewport === vp}
          onClick={() => onChange(vp)}
        >
          {vp}
        </Button>
      ))}
    </div>
  )
}

export default EditorShell
