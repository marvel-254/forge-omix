import { describe, it, expect, beforeEach } from 'vitest'
import { useSchemaStore } from '@client/store/schemaStore'

/**
 * Editor view preferences (viewport / fit-to-width) persist in
 * project.settings.editor and restore on project load.
 */

function baseProject() {
  return {
    id: 'proj_pref1234',
    name: 'Prefs Project',
    version: '1.0.0',
    pages: [{ id: 'page_home', path: '/', title: 'Home', components: [] }],
    components: [],
  }
}

describe('editorPrefs persistence', () => {
  beforeEach(() => {
    useSchemaStore.setState({
      project: null,
      activePageId: null,
      selectedIds: new Set<string>(),
      canvasRevision: 0,
      editorPrefs: { viewport: 'desktop', fitToWidth: false },
      saveState: 'idle',
      saveError: null,
    })
  })

  it('defaults to desktop / no-fit', () => {
    expect(useSchemaStore.getState().editorPrefs).toEqual({
      viewport: 'desktop',
      fitToWidth: false,
    })
  })

  it('setEditorPrefs stores prefs and mirrors them into project.settings.editor', () => {
    useSchemaStore.getState().actions.loadProject(baseProject())
    useSchemaStore.getState().setEditorPrefs({ viewport: 'mobile', fitToWidth: true })

    expect(useSchemaStore.getState().editorPrefs).toEqual({
      viewport: 'mobile',
      fitToWidth: true,
    })
    const settings = useSchemaStore.getState().project?.settings as
      | { editor?: { viewport: string; fitToWidth: boolean } }
      | undefined
    expect(settings?.editor).toEqual({ viewport: 'mobile', fitToWidth: true })
  })

  it('restores prefs on loadProject when settings.editor is present', () => {
    const project = {
      ...baseProject(),
      settings: { editor: { viewport: 'tablet', fitToWidth: true } },
    }
    useSchemaStore.getState().actions.loadProject(project)

    expect(useSchemaStore.getState().editorPrefs).toEqual({
      viewport: 'tablet',
      fitToWidth: true,
    })
  })

  it('falls back to desktop/no-fit when the project has no editor prefs', () => {
    useSchemaStore.getState().setEditorPrefs({ viewport: 'mobile', fitToWidth: true })
    useSchemaStore.getState().actions.loadProject(baseProject())

    expect(useSchemaStore.getState().editorPrefs).toEqual({
      viewport: 'desktop',
      fitToWidth: false,
    })
  })

  it('partial setEditorPrefs updates merge with existing prefs', () => {
    useSchemaStore.getState().actions.loadProject(baseProject())
    useSchemaStore.getState().setEditorPrefs({ viewport: 'tablet' })
    useSchemaStore.getState().setEditorPrefs({ fitToWidth: true })

    expect(useSchemaStore.getState().editorPrefs).toEqual({
      viewport: 'tablet',
      fitToWidth: true,
    })
  })
})
