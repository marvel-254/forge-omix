import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toggleTheme } from '../lib/theme'
import { useSchemaStore } from '../store/schemaStore'
import { Canvas } from '../canvas/Canvas'
import ComponentLibrary from '../components/library/ComponentLibrary'
import { MediaLibraryPanel } from '../components/media/MediaLibraryPanel'
import { PropertiesPanel } from '../panels/PropertiesPanel'
import { LayersPanel } from '../panels/LayersPanel'
import { TokensPanel } from '../panels/TokensPanel'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import type { ComponentType } from '../components/library'
import { defaultPropsFor } from '../canvas/registry'
import { TemplateGallery } from '../components/templates/TemplateGallery'
import { CodeModal } from '../components/codegen/CodeModal'
import { ProjectBrowser } from '../components/projects/ProjectBrowser'
import { ProjectSettings } from '../components/projects/ProjectSettings'
import { GitModal } from '../components/git/GitModal'
import { DeploymentPanel } from '../components/deployments/DeploymentPanel'
import { DomainPanel } from '../components/domains/DomainPanel'
import { AccountPanel } from '../components/account/AccountPanel'
import { PlanSelector } from '../components/commerce/PlanSelector'
import { AIPanel } from '../components/ai/AIPanel'
import { AIProjectCreationWizard } from '../components/ai/AIProjectCreationWizard'
import type { AiProjectCreationResult } from '@client/lib/aiCreation'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { FeedbackWidget } from '../components/feedback/FeedbackWidget'
import type { BuiltInTemplate } from '../templates/builtIn'
import {
  exportProjectAsTemplate,
  isTemplateDocument,
  normalizeImportedTemplate,
} from '../templates/instantiate'
import type { Component, Page } from '@client/types/schema'

type PanelTab = 'properties' | 'layers' | 'tokens'

/**
 * Top-level builder layout: header, pages sidebar, canvas, and
 * context panels (docs/04 §4.3 Canvas Shell).
 */
export function EditorShell() {
  const project = useSchemaStore((s) => s.project)
  const activePageId = useSchemaStore((s) => s.activePageId)
  const saveState = useSchemaStore((s) => s.saveState)
  const undo = useSchemaStore((s) => s.undo)
  const redo = useSchemaStore((s) => s.redo)
  const canUndo = useSchemaStore((s) => s.past.length > 0)
  const canRedo = useSchemaStore((s) => s.future.length > 0)
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
  const [sidebarTab, setSidebarTab] = useState<'components' | 'media'>('components')
  const [newPagePath, setNewPagePath] = useState('')
  const [onboardingView, setOnboardingView] = useState<'home' | 'gallery'>('home')
  const [importedTemplate, setImportedTemplate] = useState<BuiltInTemplate | null>(null)
  const [homeError, setHomeError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [codeOpen, setCodeOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [gitOpen, setGitOpen] = useState(false)
  const [deploymentOpen, setDeploymentOpen] = useState(false)
  const [domainsOpen, setDomainsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [plansOpen, setPlansOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const closeProject = useSchemaStore((s) => s.closeProject)
  const { projectId } = useParams()
  const navigate = useNavigate()

  // Keep the URL in sync with the open project; deep-link into /project/:id.
  useEffect(() => {
    if (project && project.id !== projectId) {
      navigate(`/project/${project.id}`, { replace: true })
    } else if (!project && projectId) {
      navigate('/', { replace: true })
    }
  }, [project, projectId, navigate])

  // Open a project from a /project/:id deep link.
  useEffect(() => {
    if (projectId && project?.id !== projectId) void loadFromServer(projectId)
  }, [projectId, project, loadFromServer])

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

  const handleCreateFromBrief = useCallback(
    (result: AiProjectCreationResult) => {
      const loaded = loadProject(result.project)
      if (loaded.valid) setAiOpen(false)
      return loaded
    },
    [loadProject]
  )

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

  /** Open an imported JSON document: template files go to the gallery form. */
  const handleImportedJson = useCallback(
    (parsed: unknown) => {
      if (isTemplateDocument(parsed)) {
        setImportedTemplate(normalizeImportedTemplate(parsed as Record<string, unknown>))
        setHomeError(null)
        setOnboardingView('gallery')
        return
      }
      const candidate = (parsed as { project?: unknown })?.project ?? parsed
      const result = loadProject(candidate)
      if (!result.valid) {
        setHomeError('Invalid project file: schema validation failed')
      }
    },
    [loadProject]
  )

  const handleExportTemplate = useCallback(() => {
    if (!project) return
    const payload = exportProjectAsTemplate(project as unknown as Record<string, unknown>, {
      name: `${project.name} template`,
      description: `Exported from ${project.name}`,
    })
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${project.id}.template.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [project])

  if (!project) {
    return (
      <main
        className="min-h-screen bg-background flex items-center justify-center p-4"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            setDragActive(true)
          }
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={async (e) => {
          if (!e.dataTransfer.types.includes('Files')) return
          e.preventDefault()
          setDragActive(false)
          const file = e.dataTransfer.files?.[0]
          if (!file) return
          try {
            handleImportedJson(JSON.parse(await file.text()))
          } catch {
            setHomeError('Could not parse the dropped file as JSON')
          }
        }}
      >
        <div
          className={`w-full max-w-md rounded-xl border bg-card p-8 text-card-foreground shadow-sm transition-colors ${
            dragActive ? 'border-primary-400 ring-2 ring-primary-200' : 'border-border'
          }`}
        >
          {dragActive && (
            <p className="mb-3 text-sm font-medium text-primary-700">
              Drop a project or template JSON file to open it
            </p>
          )}
          {onboardingView === 'gallery' ? (
            <TemplateGallery
              initialTemplate={importedTemplate}
              onBack={() => {
                setOnboardingView('home')
                setImportedTemplate(null)
              }}
              onCreate={(payload) => {
                const result = loadProject(payload)
                if (!result.valid) setHomeError('The template produced an invalid project.')
                return result
              }}
            />
          ) : (
          <>
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-500 text-lg font-bold text-white">
            O
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">forge@omix</h1>
          <p className="mt-1 text-sm text-muted-foreground mb-6">
            AI-native visual software builder
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => void createProjectOnServer()}>Create new project</Button>
            <Button variant="outline" onClick={() => setAiOpen(true)}>
              Start with an AI brief
            </Button>
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
                    handleImportedJson(JSON.parse(text))
                  } catch {
                    setHomeError('Could not parse the selected file as JSON')
                  } finally {
                    e.target.value = ''
                  }
                }}
              />
              <span className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
                Import JSON
              </span>
            </label>
          </div>
          <div className="mt-2 flex items-center justify-center">
            <Button variant="link" size="sm" onClick={() => setOnboardingView('gallery')}>
              Start from a template
            </Button>
          </div>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or open an existing project
            <span className="h-px flex-1 bg-border" />
          </div>
          <form
            className="flex items-center gap-2"
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
          {homeError && <p className="mt-2 text-xs text-red-600">{homeError}</p>}
          <ProjectBrowser onOpen={(id) => void handleOpenProject(id)} />
          {saveState === 'error' && saveError && (
            <p className="mt-2 text-xs text-red-600">{saveError}</p>
          )}
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Projects are saved to the API when the server is reachable; otherwise they stay local.
            Exports match the universal schema (schemas/project.schema.json). You can also drop a
            project or template JSON file anywhere on this screen.
          </p>
          </>
          )}
         </div>
         {aiOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
             <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xl">
               <AIProjectCreationWizard
                 onComplete={handleCreateFromBrief}
                 onCancel={() => setAiOpen(false)}
               />
             </div>
           </div>
         )}
         <FeedbackWidget />
      </main>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex h-12 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { closeProject(); navigate('/') }}
          aria-label="Back to projects"
          title="Back to projects"
        >
          ‹
        </Button>
        <span className="font-semibold tracking-tight text-foreground">forge@omix</span>
        <span className="h-4 w-px bg-border" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          title="Project settings"
          className="max-w-[240px] truncate rounded px-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {project.name}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={() => toggleTheme()}
            aria-label="Toggle dark mode"
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Theme
          </button>
          <span className="text-xs tabular-nums text-muted-foreground">v{project.version}</span>
          <span
            className={`flex items-center gap-1.5 text-xs ${
              saveState === 'error' ? 'text-red-600' : 'text-muted-foreground'
            }`}
            title={saveError ?? undefined}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                saveState === 'saving'
                  ? 'animate-pulse bg-amber-400'
                  : saveState === 'error'
                    ? 'bg-red-500'
                    : 'bg-emerald-500'
              }`}
            />
              {saveState === 'saving' && 'Saving…'}
              {saveState === 'saved' && 'Saved'}
              {saveState === 'error' && 'Save failed'}
            </span>
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saveState === 'saving'}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              Export
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportTemplate}
              title="Download this project as a reusable template file"
            >
              Template
            </Button>
            <Button
              size="sm"
              onClick={() => setCodeOpen(true)}
              title="Preview and download the generated React + Vite code"
            >
              Code
            </Button>
             <Button
               size="sm"
               variant="outline"
               onClick={() => setDeploymentOpen(true)}
               title="Build, inspect, publish, and roll back deployments"
             >
               Deploy
             </Button>
               <Button
                 size="sm"
                 variant="outline"
                 onClick={() => setAccountOpen(true)}
                 title="View account, projects, and plans"
               >
                 Account
               </Button>
               <Button
                 size="sm"
                 variant="outline"
                 onClick={() => setPlansOpen(true)}
                title="Compare hosting plans and start checkout"
              >
                Plans
              </Button>
              {project && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDomainsOpen(true)}
                  title="Search, save, connect, and disconnect domains"
                >
                  Domains
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setGitOpen(true)}
              title="Version control for server workspaces"
            >
              Git
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAiOpen(true)}
              title="AI design assistant"
            >
              AI
            </Button>
          </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar: pages + component library */}
        <aside className="w-64 shrink-0 border-r border-border bg-background flex flex-col min-h-0">
          <div className="px-3 pt-3 pb-2 border-b">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Pages
            </h2>
            <ul className="space-y-1">
              {pages.map((p) => (
                <li key={p.id} className="flex items-center gap-1 group">
                  <button
                    type="button"
                    onClick={() => setActivePage(p.id)}
                    aria-pressed={p.id === activePageId}
                    className={`flex-1 min-w-0 text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                      p.id === activePageId
                        ? 'bg-primary-100 text-primary-900 font-medium dark:bg-primary-900/40 dark:text-primary-100'
                        : 'hover:bg-accent text-foreground/80'
                    }`}
                  >
                    <span className="block truncate leading-tight">{p.title}</span>
                    <span className="block truncate text-xs leading-tight text-muted-foreground">{p.path}</span>
                  </button>
                  {pages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete page ${p.title}`}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
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
          <div className="flex gap-1 border-b px-3 py-2" role="tablist" aria-label="Left sidebar">
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'components'}
              onClick={() => setSidebarTab('components')}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                sidebarTab === 'components'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              Components
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'media'}
              onClick={() => setSidebarTab('media')}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                sidebarTab === 'media'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              Media
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              {sidebarTab === 'media' ? (
                <MediaLibraryPanel projectId={project?.id} />
              ) : (
                <ComponentLibrary onSelectComponent={handleAddComponent} />
              )}
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <ErrorBoundary area="canvas" key={`${activePageId}-${pages.length}`}>
          <Canvas viewport={viewport} onViewportChange={setViewport} />
        </ErrorBoundary>

        {/* Right sidebar: panels */}
        <aside className="w-72 shrink-0 border-l border-border bg-background flex flex-col min-h-0">
          <div className="flex border-b">
            {(['properties', 'layers'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPanelTab(tab)}
                aria-pressed={panelTab === tab}
                className={`flex-1 px-3 py-2 text-sm capitalize transition-colors ${
                  panelTab === tab
                    ? 'border-b-2 border-primary-500 text-primary-700 font-medium dark:text-primary-300'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {panelTab === 'properties' ? (
              <PropertiesPanel />
            ) : panelTab === 'tokens' ? (
              <TokensPanel />
            ) : (
              <LayersPanel />
            )}
          </div>
        </aside>
      </div>
      {codeOpen && project && <CodeModal project={project} onClose={() => setCodeOpen(false)} />}
      {settingsOpen && project && <ProjectSettings onClose={() => setSettingsOpen(false)} />}
      {gitOpen && <GitModal onClose={() => setGitOpen(false)} />}
        {deploymentOpen && project && (
          <DeploymentPanel projectId={project.id} onClose={() => setDeploymentOpen(false)} />
        )}
        {domainsOpen && project && (
          <DomainPanel projectId={project.id} onClose={() => setDomainsOpen(false)} />
        )}
        {accountOpen && project && (
          <AccountPanel
            isOpen={accountOpen}
            onClose={() => setAccountOpen(false)}
            onOpenProject={(projectId) => {
              setAccountOpen(false)
              void handleOpenProject(projectId)
            }}
            onShowPlans={() => {
              setAccountOpen(false)
              setPlansOpen(true)
            }}
          />
        )}
        {plansOpen && project && <PlanSelector projectId={project.id} onClose={() => setPlansOpen(false)} />}
       {aiOpen && <AIPanel onClose={() => setAiOpen(false)} onCreateProject={handleCreateFromBrief} />}

      <FeedbackWidget />
    </div>
  )
}

export default EditorShell
