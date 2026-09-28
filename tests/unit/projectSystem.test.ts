import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { cancelAutosave, maybeAutosave, useSchemaStore } from '@client/store/schemaStore'

/**
 * Phase 7 project system: close, dirty tracking, settings validation,
 * and the debounced auto-save cycle.
 */

function seedProject() {
  useSchemaStore.setState({
    project: {
      id: 'proj_test1234',
      name: 'Test Project',
      description: 'A project',
      version: '1.0.0',
      pages: [{ id: 'page_home', path: '/', title: 'Home', components: [] }],
      components: [],
    } as never,
    activePageId: 'page_home',
    selectedIds: new Set<string>(),
    canvasRevision: 0,
    saveState: 'saved',
    saveError: null,
  })
}

function okEnvelope(data: unknown = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data }),
  }
}

describe('closeProject', () => {
  beforeEach(() => {
    seedProject()
  })

  it('resets project, selection, and save state', () => {
    useSchemaStore.getState().closeProject()
    const state = useSchemaStore.getState()
    expect(state.project).toBe(null)
    expect(state.activePageId).toBe(null)
    expect(state.selectedIds.size).toBe(0)
    expect(state.saveState).toBe('idle')
    expect(state.saveError).toBe(null)
  })
})

describe('dirty tracking', () => {
  beforeEach(() => {
    seedProject()
  })

  afterEach(() => {
    cancelAutosave()
  })

  it('marks a saved project dirty on mutation', () => {
    const result = useSchemaStore
      .getState()
      .actions.updateProject({ name: 'Renamed' } as never)
    expect(result.valid).toBe(true)
    expect(useSchemaStore.getState().saveState).toBe('idle')
    expect(useSchemaStore.getState().project?.name).toBe('Renamed')
  })

  it('rejects settings with an empty name', () => {
    const result = useSchemaStore.getState().actions.updateProject({ name: '' } as never)
    expect(result.valid).toBe(false)
    expect(useSchemaStore.getState().project?.name).toBe('Test Project')
  })

  it('rejects settings with a non-semver version', () => {
    const result = useSchemaStore.getState().actions.updateProject({ version: 'v1' } as never)
    expect(result.valid).toBe(false)
    expect(useSchemaStore.getState().project?.version).toBe('1.0.0')
  })

  it('accepts valid settings', () => {
    const result = useSchemaStore.getState().actions.updateProject({
      name: 'Renamed',
      description: 'New description',
      version: '1.2.0',
    } as never)
    expect(result.valid).toBe(true)
    expect(useSchemaStore.getState().project?.version).toBe('1.2.0')
  })
})

describe('loadProject save state', () => {
  it('marks freshly loaded projects unsaved', () => {
    useSchemaStore.setState({ saveState: 'saved' })
    const result = useSchemaStore.getState().actions.loadProject({
      id: 'proj_loaded12',
      name: 'Loaded',
      version: '1.0.0',
      pages: [{ id: 'page_home', path: '/', title: 'Home', components: [] }],
      components: [],
    })
    expect(result.valid).toBe(true)
    expect(useSchemaStore.getState().saveState).toBe('idle')
  })
})

describe('saveToServer project guard', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    seedProject()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    cancelAutosave()
  })

  it('does not report success after the project was closed mid-flight', async () => {
    let resolveFetch!: (value: unknown) => void
    fetchMock.mockReturnValue(new Promise((resolve) => (resolveFetch = resolve)))
    const saving = useSchemaStore.getState().saveToServer()
    useSchemaStore.getState().closeProject()
    resolveFetch(okEnvelope({ id: 'proj_test1234' }))
    expect(await saving).toBe(true)
    expect(useSchemaStore.getState().project).toBe(null)
    expect(useSchemaStore.getState().saveState).toBe('idle')
  })
})

describe('maybeAutosave', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    seedProject()
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(okEnvelope({ id: 'proj_test1234' }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    cancelAutosave()
  })

  it('saves the composite project when idle with unsaved changes', async () => {
    useSchemaStore.setState({ saveState: 'idle' })
    maybeAutosave()
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/projects/proj_test1234/project')
    expect(init.method).toBe('PUT')
    await vi.waitFor(() => {
      expect(useSchemaStore.getState().saveState).toBe('saved')
    })
  })

  it('does nothing while a save is in flight', () => {
    useSchemaStore.setState({ saveState: 'saving' })
    maybeAutosave()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does nothing without a project', () => {
    useSchemaStore.setState({ project: null, saveState: 'idle' })
    maybeAutosave()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('surfaces server errors', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: { message: 'Boom', code: 'X' } }),
    })
    useSchemaStore.setState({ saveState: 'idle' })
    maybeAutosave()
    await vi.waitFor(() => {
      expect(useSchemaStore.getState().saveState).toBe('error')
    })
  })
})
