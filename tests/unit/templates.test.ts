import { describe, it, expect } from 'vitest'
import {
  defaultVariableValues,
  substituteVariables,
  validateVariableSet,
  validateVariableValue,
} from '@/client/templates/substitute'
import { BUILT_IN_TEMPLATES } from '@/client/templates/builtIn'
import {
  exportProjectAsTemplate,
  instantiateTemplate,
  isTemplateDocument,
  normalizeImportedTemplate,
} from '@/client/templates/instantiate'
import { ProjectSchema, TemplateSchema } from '@server/validation'

describe('substituteVariables', () => {
  it('replaces whole-string placeholders with typed values', () => {
    expect(substituteVariables('{{count}}', { count: 3 })).toBe(3)
    expect(substituteVariables('{{enabled}}', { enabled: true })).toBe(true)
    expect(substituteVariables('{{tags}}', { tags: ['a'] })).toEqual(['a'])
  })

  it('interpolates embedded placeholders as text', () => {
    expect(substituteVariables('Hello {{name}}!', { name: 'Omix' })).toBe('Hello Omix!')
    expect(substituteVariables('n={{n}}', { n: 42 })).toBe('n=42')
  })

  it('leaves unknown variables in place', () => {
    expect(substituteVariables('{{missing}} and {{a}}', { a: 'x' })).toBe('{{missing}} and x')
  })

  it('walks nested objects and arrays', () => {
    const out = substituteVariables(
      { pages: [{ title: '{{app}}', tags: ['{{t}}', 'fixed'] }] },
      { app: 'A', t: 'T' }
    )
    expect(out).toEqual({ pages: [{ title: 'A', tags: ['T', 'fixed'] }] })
  })

  it('passes non-strings through untouched', () => {
    expect(substituteVariables(7, {})).toBe(7)
    expect(substituteVariables(null, {})).toBe(null)
  })
})

describe('validateVariableValue', () => {
  it('enforces required', () => {
    const v = { name: 'appName', type: 'string', required: true } as const
    expect(validateVariableValue(v, '')).not.toBe(null)
    expect(validateVariableValue(v, 'x')).toBe(null)
    expect(validateVariableValue({ ...v, required: false }, '')).toBe(null)
  })

  it('validates colors as hex', () => {
    const v = { name: 'c', type: 'color' } as const
    expect(validateVariableValue(v, '#3b82f6')).toBe(null)
    expect(validateVariableValue(v, 'red')).not.toBe(null)
    expect(validateVariableValue(v, 42)).not.toBe(null)
  })

  it('validates numbers, booleans, arrays, objects', () => {
    expect(validateVariableValue({ name: 'n', type: 'number' }, 3)).toBe(null)
    expect(validateVariableValue({ name: 'n', type: 'number' }, 'x')).not.toBe(null)
    expect(validateVariableValue({ name: 'b', type: 'boolean' }, false)).toBe(null)
    expect(validateVariableValue({ name: 'b', type: 'boolean' }, 0)).not.toBe(null)
    expect(validateVariableValue({ name: 'a', type: 'array' }, [])).toBe(null)
    expect(validateVariableValue({ name: 'o', type: 'object' }, {})).toBe(null)
    expect(validateVariableValue({ name: 'o', type: 'object' }, [])).not.toBe(null)
  })
})

describe('defaultVariableValues + validateVariableSet', () => {
  const vars = [
    { name: 'appName', type: 'string', default: 'My App', required: true },
    { name: 'primaryColor', type: 'color', default: '#3b82f6' },
  ] as const

  it('prefers overrides over defaults', () => {
    expect(defaultVariableValues([...vars], { appName: 'X' })).toEqual({
      appName: 'X',
      primaryColor: '#3b82f6',
    })
  })

  it('reports errors per variable', () => {
    const errors = validateVariableSet([...vars], { appName: '', primaryColor: 'red' })
    expect(Object.keys(errors).sort()).toEqual(['appName', 'primaryColor'])
    expect(validateVariableSet([...vars], { appName: 'X', primaryColor: '#fff' })).toEqual({})
  })
})

describe('built-in templates', () => {
  it('instantiates to a valid canonical project', () => {
    for (const template of BUILT_IN_TEMPLATES) {
      const project = instantiateTemplate(template)
      const result = ProjectSchema.safeParse(project)
      expect(result.success, `${template.id} should validate`).toBe(true)
    }
  })

  it('substitutes variable values into content', () => {
    const landing = BUILT_IN_TEMPLATES.find((t) => t.id === 'tmpl_landing')!
    const project = instantiateTemplate(landing, { appName: 'Acme', primaryColor: '#ff0000' }) as {
      name: string
      pages: Array<{ components: Array<{ props: Record<string, unknown> }> }>
      designTokens: { colors: { primary: string } }
    }
    expect(project.name).toBe('Acme')
    expect(project.pages[0].components[0].props.logo).toBe('Acme')
    expect(project.designTokens.colors.primary).toBe('#ff0000')
  })

  it('generates unique project ids', () => {
    const blank = BUILT_IN_TEMPLATES.find((t) => t.id === 'tmpl_blank')!
    const a = instantiateTemplate(blank) as { id: string }
    const b = instantiateTemplate(blank) as { id: string }
    expect(a.id).not.toBe(b.id)
    expect(a.id.startsWith('proj_')).toBe(true)
  })
})

describe('template file round-trip', () => {
  it('exports a project as a valid template document', () => {
    const template = exportProjectAsTemplate(
      {
        name: 'Demo',
        version: '1.0.0',
        pages: [{ id: 'page_home', path: '/', title: 'Home', components: [] }],
        components: [],
      },
      { name: 'Demo template' }
    )
    expect(isTemplateDocument(template)).toBe(true)
    expect(TemplateSchema.safeParse({ ...template, schema: (template as { schema: unknown }).schema }).success).toBe(
      true
    )
  })

  it('detects template vs project documents', () => {
    expect(isTemplateDocument({ id: 'tmpl_x', name: 'T', version: '1.0.0', schema: {} })).toBe(true)
    expect(
      isTemplateDocument({ id: 'proj_x', name: 'P', version: '1.0.0', pages: [], components: [] })
    ).toBe(false)
    expect(isTemplateDocument(null)).toBe(false)
  })

  it('normalizes an imported file for the gallery form', () => {
    const normalized = normalizeImportedTemplate({
      id: 'tmpl_custom',
      name: 'Custom',
      version: '2.0.0',
      variables: [{ name: 'appName', type: 'string', default: 'Hi' }],
      schema: { pages: [] },
    })
    expect(normalized.variables).toHaveLength(1)
    expect(normalized.schema).toEqual({ pages: [] })
    const project = instantiateTemplate(normalized, { appName: 'Yo' })
    expect(ProjectSchema.safeParse(project).success).toBe(true)
  })
})
