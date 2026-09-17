import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  validate,
  ProjectSchema,
  PageSchema,
  ComponentSchema,
  TaskSchema,
  FlowSchema,
  DesignTokensSchema,
  type ValidationResult,
} from '@server/validation'
import type { Page, Component, Task, Flow, DesignTokens } from '@client/types/schema'
import { projectsApi, ApiError } from '@client/lib/api'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface SchemaState {
  project: ProjectSchema | null
  version: string
  lastValidated: Date | null
  // Canvas state
  selectedIds: Set<string>
  /** Id of the page currently open on the canvas. */
  activePageId: string | null
  /** Incremented on every structural page change so Puck can be remounted. */
  canvasRevision: number
  /** Server persistence state for the header save indicator. */
  saveState: SaveState
  saveError: string | null
  /** Component type currently being dragged from the library (null when not dragging). */
  draggingLibraryType: string | null
  setDraggingLibraryType: (type: string | null) => void
  /** Persisted editor view preferences (project.settings.editor). */
  editorPrefs: { viewport: 'desktop' | 'tablet' | 'mobile'; fitToWidth: boolean }
  /** Update editor view preferences and persist them into project.settings. */
  setEditorPrefs: (prefs: Partial<{ viewport: 'desktop' | 'tablet' | 'mobile'; fitToWidth: boolean }>) => void
  setSaveState: (state: SaveState, error?: string | null) => void
  /** Load the canonical project from the server by id. */
  loadFromServer: (projectId: string) => Promise<boolean>
  /** Persist the current canonical project to the server. */
  saveToServer: () => Promise<boolean>
  setSelectedIds: (ids: Set<string>) => void
  toggleSelected: (id: string) => void
  selectComponent: (id: string) => void
  setComponentPosition: (
    id: string,
    position: { x: number; y: number; viewport?: 'desktop' | 'tablet' | 'mobile' }
  ) => void
  actions: {
    loadProject: (data: unknown) => ValidationResult<ProjectSchema>
    /** Create a minimal starter project locally, then persist it to the server (falls back to local-only when the API is unreachable). */
    createProjectOnServer: (name?: string) => Promise<ValidationResult<ProjectSchema>>
    /** Create a minimal starter project and set it as the active project. */
    createProject: (name?: string) => ValidationResult<ProjectSchema>
    setActivePage: (pageId: string) => void
    updateProject: (data: Record<string, unknown>) => ValidationResult<ProjectSchema>
    addPage: (page: Page) => ValidationResult<ProjectSchema>
    removePage: (pageId: string) => ValidationResult<ProjectSchema>
    /** Insert a component into the active page's component tree. */
    addComponentToPage: (component: Component) => ValidationResult<ProjectSchema>
  /** Remove a component from the active page's component tree. */
  removeComponentFromPage: (componentId: string) => ValidationResult<ProjectSchema>
  /** Move a component to a new index within the active page's component tree. */
  moveComponentInPage: (componentId: string, toIndex: number) => ValidationResult<ProjectSchema>
    addComponent: (component: Component) => ValidationResult<ProjectSchema>
    removeComponent: (componentId: string) => ValidationResult<ProjectSchema>
    updateComponent: (
      componentId: string,
      updates: Record<string, unknown>
    ) => ValidationResult<ProjectSchema>
    addTask: (task: Task) => ValidationResult<ProjectSchema>
    updateTask: (taskId: string, updates: Partial<Task>) => ValidationResult<ProjectSchema>
    addFlow: (flow: Flow) => ValidationResult<ProjectSchema>
    removeFlow: (flowId: string) => ValidationResult<ProjectSchema>
    setDesignTokens: (tokens: DesignTokens) => ValidationResult<ProjectSchema>
    getVersion: () => string
    getLastValidated: () => Date | null
  }
}

const initialState: Omit<SchemaState, 'actions'> = {
  project: null,
  version: '1.0.0',
  lastValidated: null,
  selectedIds: new Set<string>(),
  activePageId: null,
  canvasRevision: 0,
  saveState: 'idle' as SaveState,
  saveError: null,
  draggingLibraryType: null,
  setDraggingLibraryType: () => {},
  editorPrefs: { viewport: 'desktop' as const, fitToWidth: false },
  setEditorPrefs: () => {},
  setSelectedIds: () => {},
  toggleSelected: () => {},
  selectComponent: () => {},
  setComponentPosition: () => {},
  setSaveState: () => {},
  loadFromServer: async () => false,
  saveToServer: async () => false,
}

export const useSchemaStore = create<SchemaState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      // Canvas state (kept outside `project` — selection is ephemeral UI state)
      selectedIds: new Set<string>(),
      activePageId: null,
      canvasRevision: 0,
      saveState: 'idle' as SaveState,
      saveError: null,
      draggingLibraryType: null,
      setDraggingLibraryType: (draggingLibraryType) => set({ draggingLibraryType }),
      editorPrefs: { viewport: 'desktop' as const, fitToWidth: false },
      setEditorPrefs: (prefs) => {
        const next = { ...get().editorPrefs, ...prefs }
        set({ editorPrefs: next })
        // Mirror into project.settings.editor so Save persists it.
        const { project } = get()
        if (!project) return
        const settings = (project.settings ?? {}) as Record<string, unknown>
        get().actions.updateProject({
          settings: { ...settings, editor: next },
        } as unknown as Record<string, unknown>)
      },
      setSaveState: (saveState, saveError = null) => set({ saveState, saveError }),
      loadFromServer: async (projectId) => {
        try {
          set({ saveState: 'saving', saveError: null })
          const composite = await projectsApi.getComposite(projectId)
          const result = get().actions.loadProject(composite)
          if (!result.valid) {
            set({ saveState: 'error', saveError: 'Server project failed schema validation' })
            return false
          }
          // Restore persisted editor view preferences.
          const editor = (composite as { settings?: { editor?: { viewport?: 'desktop' | 'tablet' | 'mobile'; fitToWidth?: boolean } } })
            .settings?.editor
          set({
            editorPrefs: {
              viewport: editor?.viewport ?? 'desktop',
              fitToWidth: editor?.fitToWidth ?? false,
            },
          })
          set({ saveState: 'saved' })
          return true
        } catch (error) {
          const message = error instanceof ApiError ? error.message : 'Failed to load project from server'
          set({ saveState: 'error', saveError: message })
          return false
        }
      },
      saveToServer: async () => {
        const { project } = get()
        if (!project) return false
        try {
          set({ saveState: 'saving', saveError: null })
          const payload = project as unknown as Record<string, unknown>
          try {
            await projectsApi.saveComposite(project.id, payload)
          } catch (error) {
            // Project not on the server yet — create it with the full payload.
            if (error instanceof ApiError && error.status === 404) {
              await projectsApi.create(payload)
            } else {
              throw error
            }
          }
          set({ saveState: 'saved' })
          return true
        } catch (error) {
          const message = error instanceof ApiError ? error.message : 'Failed to save project to server'
          set({ saveState: 'error', saveError: message })
          return false
        }
      },
      setSelectedIds: (ids) => set({ selectedIds: ids }),
      toggleSelected: (id) =>
        set((state) => {
          const next = new Set(state.selectedIds)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return { selectedIds: next }
        }),
      selectComponent: (id) => set({ selectedIds: new Set([id]) }),
      setComponentPosition: (id, position) =>
        get().actions.updateComponent(id, {
          position,
        }),
      actions: {
        loadProject: (data) => {
          const result = validate(ProjectSchema, data)
          if (result.valid && result.data) {
            const editor = (
              result.data as unknown as {
                settings?: { editor?: { viewport?: 'desktop' | 'tablet' | 'mobile'; fitToWidth?: boolean } }
              }
            ).settings?.editor
            set({
              project: result.data,
              version: result.data.version,
              lastValidated: new Date(),
              activePageId: result.data.pages[0]?.id ?? null,
              canvasRevision: get().canvasRevision + 1,
              editorPrefs: {
                viewport: editor?.viewport ?? 'desktop',
                fitToWidth: editor?.fitToWidth ?? false,
              },
            })
          }
          return result
        },
        createProject: (name = 'Untitled Project') => {
          const starter: ProjectSchema = {
            id: 'proj_' + Math.random().toString(36).slice(2, 10),
            name,
            version: '1.0.0',
            pages: [
              {
                id: 'page_home',
                path: '/',
                title: 'Home',
                components: [],
              },
            ],
            components: [],
          }
          const result = validate(ProjectSchema, starter as unknown)
          if (result.valid && result.data) {
            set({
              project: result.data,
              version: result.data.version,
              lastValidated: new Date(),
              activePageId: 'page_home',
              selectedIds: new Set<string>(),
              canvasRevision: get().canvasRevision + 1,
            })
          }
          return result
        },
        createProjectOnServer: async (name) => {
          // Create locally first so the editor is usable even when the API is unreachable.
          const result = get().actions.createProject(name)
          if (!result.valid) return result

          try {
            set({ saveState: 'saving', saveError: null })
            await projectsApi.create(result.data as unknown as Record<string, unknown>)
            set({ saveState: 'saved' })
          } catch (error) {
            // Offline/unreachable API: keep the local project, surface the state.
            const message = error instanceof ApiError ? error.message : 'Server unreachable — working locally'
            set({ saveState: 'error', saveError: message })
          }
          return result
        },
        setActivePage: (pageId) =>
          set((state) => {
            if (!state.project?.pages.some((p) => p.id === pageId)) return state
            return {
              activePageId: pageId,
              selectedIds: new Set<string>(),
              canvasRevision: state.canvasRevision + 1,
            }
          }),
        updateProject: (data) => {
          const { project } = get()
          if (!project) {
            return { valid: false }
          }
          const updated = { ...project, ...data, updatedAt: new Date().toISOString() }
          const result = validate(ProjectSchema, updated as unknown)
          if (result.valid && result.data) {
            set({ project: result.data, lastValidated: new Date() })
          }
          return result
        },
        addPage: (page) => {
          const { project } = get()
          if (!project) {
            return { valid: false }
          }
          const pageResult = validate(PageSchema, page)
          if (!pageResult.valid) {
            return { valid: false }
          }
          const updated = {
            ...project,
            pages: [...project.pages, page],
            updatedAt: new Date().toISOString(),
          }
          const result = get().actions.updateProject(updated as unknown as Record<string, unknown>)
          if (result.valid) {
            // Open the new page immediately
            set((state) => ({
              activePageId: page.id,
              selectedIds: new Set<string>(),
              canvasRevision: state.canvasRevision + 1,
            }))
          }
          return result
        },
        removePage: (pageId) => {
          const { project } = get()
          if (!project) {
            return { valid: false }
          }
          if (project.pages.length <= 1) {
            // A project must keep at least one page
            return { valid: false }
          }
          const remaining = project.pages.filter((p) => p.id !== pageId)
          const updated = {
            ...project,
            pages: remaining,
            updatedAt: new Date().toISOString(),
          }
          const result = get().actions.updateProject(updated as unknown as Record<string, unknown>)
          if (result.valid && get().activePageId === pageId) {
            set((state) => ({
              activePageId: remaining[0]?.id ?? null,
              selectedIds: new Set<string>(),
              canvasRevision: state.canvasRevision + 1,
            }))
          }
          return result
        },
        addComponentToPage: (component) => {
          const { project, activePageId } = get()
          if (!project || !activePageId) return { valid: false }
          const compResult = validate(ComponentSchema, component)
          if (!compResult.valid) return { valid: false }

          const updated = {
            ...project,
            pages: project.pages.map((p) =>
              p.id === activePageId
                ? { ...p, components: [...p.components, component] }
                : p
            ),
            updatedAt: new Date().toISOString(),
          }
          const result = get().actions.updateProject(updated as unknown as Record<string, unknown>)
          if (result.valid) {
            // Remount Puck so its canvas picks up externally-added content
            // (Puck only reads the `data` prop on mount).
            set({
              selectedIds: new Set([component.id]),
              canvasRevision: get().canvasRevision + 1,
            })
          }
          return result
        },
        removeComponentFromPage: (componentId) => {
          const { project, activePageId } = get()
          if (!project || !activePageId) return { valid: false }

          const updated = {
            ...project,
            pages: project.pages.map((p) =>
              p.id === activePageId
                ? { ...p, components: p.components.filter((c) => c.id !== componentId) }
                : p
            ),
            updatedAt: new Date().toISOString(),
          }
          const result = get().actions.updateProject(updated as unknown as Record<string, unknown>)
          if (result.valid) {
            set((state) => {
              const next = new Set(state.selectedIds)
              next.delete(componentId)
              return { selectedIds: next }
            })
          }
          return result
        },
        moveComponentInPage: (componentId, toIndex) => {
          const { project, activePageId } = get()
          if (!project || !activePageId) return { valid: false }

          const page = project.pages.find((p) => p.id === activePageId)
          if (!page) return { valid: false }

          const fromIndex = page.components.findIndex((c) => c.id === componentId)
          if (fromIndex === -1) return { valid: false }

          const clamped = Math.max(0, Math.min(toIndex, page.components.length - 1))
          if (clamped === fromIndex) return { valid: true, data: project }

          const reordered = [...page.components]
          const [moved] = reordered.splice(fromIndex, 1)
          reordered.splice(clamped, 0, moved)

          const updated = {
            ...project,
            pages: project.pages.map((p) =>
              p.id === activePageId ? { ...p, components: reordered } : p
            ),
            updatedAt: new Date().toISOString(),
          }
          const result = get().actions.updateProject(updated as unknown as Record<string, unknown>)
          if (result.valid) {
            // Puck only reads `data` on mount — remount so the canvas reflects the new order.
            set({ canvasRevision: get().canvasRevision + 1 })
          }
          return result
        },
        addComponent: (component) => {
          const { project } = get()
          if (!project) {
            return { valid: false }
          }
          const compResult = validate(ComponentSchema, component)
          if (!compResult.valid) {
            return { valid: false }
          }
          const updated = {
            ...project,
            components: [...project.components, component],
            updatedAt: new Date().toISOString(),
          }
          return get().actions.updateProject(updated as unknown as Record<string, unknown>)
        },
        updateComponent: (componentId, updates) => {
          const { project } = get()
          if (!project) {
            return { valid: false }
          }
          const updatedComponents = project.components.map((c) =>
            c.id === componentId ? { ...c, ...updates } : c
          )
          const updated = {
            ...project,
            components: updatedComponents,
            updatedAt: new Date().toISOString(),
          }
          return get().actions.updateProject(updated as unknown as Record<string, unknown>)
        },
        removeComponent: (componentId) => {
          const { project } = get()
          if (!project) {
            return { valid: false }
          }
          const updated = {
            ...project,
            components: project.components.filter(c => c.id !== componentId),
            updatedAt: new Date().toISOString(),
          }
          return get().actions.updateProject(updated)
        },
        addTask: (task) => {
          const { project } = get()
          if (!project) {
            return { valid: false }
          }
          const taskResult = validate(TaskSchema, task)
          if (!taskResult.valid) {
            return { valid: false }
          }
          const updated = {
            ...project,
            tasks: [...(project.tasks || []), task],
            updatedAt: new Date().toISOString(),
          }
          return get().actions.updateProject(updated as unknown as Record<string, unknown>)
        },
        updateTask: (taskId, updates) => {
          const { project } = get()
          if (!project || !project.tasks) {
            return { valid: false }
          }
          const updatedTasks = project.tasks.map(t =>
            t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          )
          return get().actions.updateProject({ tasks: updatedTasks } as unknown as Record<string, unknown>)
        },
        addFlow: (flow) => {
          const { project } = get()
          if (!project) {
            return { valid: false }
          }
          const flowResult = validate(FlowSchema, flow)
          if (!flowResult.valid) {
            return { valid: false }
          }
          const updated = {
            ...project,
            flows: [...(project.flows || []), flow],
            updatedAt: new Date().toISOString(),
          }
          return get().actions.updateProject(updated as unknown as Record<string, unknown>)
        },
        removeFlow: (flowId) => {
          const { project } = get()
          if (!project) {
            return { valid: false }
          }
          const updated = {
            ...project,
            flows: project.flows?.filter(f => f.id !== flowId) || [],
            updatedAt: new Date().toISOString(),
          }
          return get().actions.updateProject(updated as unknown as Record<string, unknown>)
        },
        setDesignTokens: (tokens) => {
          const { project } = get()
          if (!project) {
            return { valid: false }
          }
          const tokensResult = validate(DesignTokensSchema, tokens)
          if (!tokensResult.valid) {
            return { valid: false }
          }
          const updated = {
            ...project,
            designTokens: tokens,
            updatedAt: new Date().toISOString(),
          }
          return get().actions.updateProject(updated as unknown as Record<string, unknown>)
        },
        getVersion: () => get().version,
        getLastValidated: () => get().lastValidated,
      },
    }),
    { name: 'SchemaEngine' }
  )
)
