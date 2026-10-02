import { describe, it, expect, beforeEach } from 'vitest'
import { useSchemaStore } from '@client/store/schemaStore'

function baseProject() {
  return {
    id: 'proj_undo1234',
    name: 'Undo Project',
    version: '1.0.0',
    pages: [{ id: 'page_home', path: '/', title: 'Home', components: [] }],
    components: [],
  }
}

describe('undo/redo', () => {
  beforeEach(() => {
    useSchemaStore.setState({
      project: null,
      activePageId: null,
      selectedIds: new Set<string>(),
      canvasRevision: 0,
      past: [],
      future: [],
      saveState: 'idle',
      saveError: null,
    })
    useSchemaStore.getState().actions.loadProject(baseProject())
  })

  it('undoes a structural edit and redoes it', () => {
    const store = useSchemaStore.getState()
    store.actions.updateProject({ name: 'Renamed' } as Record<string, unknown>)
    expect(useSchemaStore.getState().project?.name).toBe('Renamed')
    expect(useSchemaStore.getState().past.length).toBe(1)

    useSchemaStore.getState().undo()
    expect(useSchemaStore.getState().project?.name).toBe('Undo Project')
    expect(useSchemaStore.getState().future.length).toBe(1)

    useSchemaStore.getState().redo()
    expect(useSchemaStore.getState().project?.name).toBe('Renamed')
    expect(useSchemaStore.getState().past.length).toBe(1)
  })

  it('clears redo stack on a new edit', () => {
    useSchemaStore.getState().actions.updateProject({ name: 'A' } as Record<string, unknown>)
    useSchemaStore.getState().undo()
    useSchemaStore.getState().actions.updateProject({ name: 'B' } as Record<string, unknown>)
    expect(useSchemaStore.getState().future.length).toBe(0)
    expect(useSchemaStore.getState().project?.name).toBe('B')
  })
})
