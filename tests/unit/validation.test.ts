import { describe, it, expect } from 'vitest'
import {
  ProjectSchema,
  PageSchema,
  ComponentSchema,
  FlowSchema,
  TaskSchema,
  TemplateSchema,
  DesignTokensSchema,
  validate,
  validateOrThrow,
  formatErrors,
  isNonEmptyArray,
  ButtonPropsSchema,
  InputPropsSchema,
  CardPropsSchema,
  NavbarPropsSchema,
  ChartPropsSchema,
  TablePropsSchema,
} from '@server/validation'
import {
  projectSchema,
  pageSchema,
  componentSchema,
  designTokensSchema,
  flowSchema,
  taskSchema,
  templateSchema,
  mediaSchema,
  validateSchema,
  validateSchemaSafe,
  validateAndTransform,
} from '@/lib/validations'

const validProject = {
  id: 'proj_abc123456',
  name: 'Test Project',
  version: '1.0.0',
  pages: [],
  components: [],
}

const validPage = {
  id: 'page_home',
  path: '/',
  title: 'Home',
  components: [{ id: 'comp_btn1', type: 'Button', props: { label: 'Click' } }],
}

const validComponent = {
  id: 'comp_btn1',
  type: 'Button',
  props: { label: 'Submit', variant: 'primary' },
}

const validFlow = {
  id: 'flow_checkout',
  name: 'Checkout',
  steps: [
    { id: 'step_start', name: 'Start', type: 'page', target: '/checkout' },
    { id: 'step_end', name: 'End', type: 'end' },
  ],
  transitions: [{ from: 'step_start', to: 'step_end' }],
}

const validTask = {
  id: 'task_add_login',
  title: 'Add login',
  description: 'Implement login page',
  type: 'feature',
  status: 'todo',
  priority: 'high',
}

const validTemplate = {
  id: 'tmpl_dashboard',
  name: 'Dashboard',
  version: '1.0.0',
  schema: {},
}

const validDesignTokens = {
  colors: { primary: '#3B82F6', text: { primary: '#000' } },
  typography: { fontFamily: { sans: 'Inter' } },
  spacing: { sm: '0.25rem' },
  radius: { md: '0.5rem' },
  shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)' },
  breakpoints: { sm: 640 },
  motion: { duration: { fast: '150ms' }, easing: { default: 'ease' } },
  zIndex: { base: 0 },
}

describe('validate utility', () => {
  it('returns valid for correct project data', () => {
    const result = validate(ProjectSchema, validProject)
    expect(result.valid).toBe(true)
    expect(result.data?.id).toBe('proj_abc123456')
  })

  it('returns invalid for missing required fields', () => {
    const result = validate(ProjectSchema, { name: 'Test' })
    expect(result.valid).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('rejects bad id pattern', () => {
    const result = validate(ProjectSchema, { ...validProject, id: 'bad-id' })
    expect(result.valid).toBe(false)
  })

  it('formatErrors returns readable strings', () => {
    const result = validate(ProjectSchema, { id: 'bad' })
    expect(result.valid).toBe(false)
    if (result.errors) {
      const errors = formatErrors(result.errors)
      expect(errors.length).toBeGreaterThan(0)
      expect(typeof errors[0]).toBe('string')
    }
  })
})

describe('validateOrThrow', () => {
  it('returns parsed data on success', () => {
    expect(validateOrThrow(ProjectSchema, validProject)).toEqual(validProject)
  })

  it('throws on invalid data', () => {
    expect(() => validateOrThrow(ProjectSchema, { bad: true })).toThrow()
  })
})

describe('isNonEmptyArray', () => {
  it('returns true for non-empty arrays', () => {
    expect(isNonEmptyArray([1, 2])).toBe(true)
  })
  it('returns false for empty arrays', () => {
    expect(isNonEmptyArray([])).toBe(false)
  })
  it('returns false for null', () => {
    expect(isNonEmptyArray(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(isNonEmptyArray(undefined)).toBe(false)
  })
})

describe('ProjectSchema', () => {
  it('accepts valid project', () => {
    expect(ProjectSchema.safeParse(validProject).success).toBe(true)
  })

  it('requires id, name, version, pages, components', () => {
    const { id, name, version, pages, components, ...rest } = validProject
    const result = ProjectSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('accepts optional flows, tasks, templates, designTokens, settings', () => {
    const data = {
      ...validProject,
      flows: [validFlow],
      tasks: [validTask],
      templates: [validTemplate],
      designTokens: validDesignTokens,
      settings: { theme: 'dark', basePath: '/app' },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    }
    expect(ProjectSchema.safeParse(data).success).toBe(true)
  })

  it('rejects wrong id pattern', () => {
    expect(ProjectSchema.safeParse({ ...validProject, id: 'x' }).success).toBe(false)
  })
})

describe('PageSchema', () => {
  it('accepts valid page', () => {
    expect(PageSchema.safeParse(validPage).success).toBe(true)
  })

  it('rejects path not starting with /', () => {
    expect(PageSchema.safeParse({ ...validPage, path: 'no-slash' }).success).toBe(false)
  })

  it('accepts optional layout, meta, responsiveRules, auth', () => {
    const data = {
      ...validPage,
      layout: { type: 'sidebar', containerWidth: 'contained' },
      meta: { title: 'Home SEO', noindex: false },
      responsiveRules: [{ breakpoint: 'md', modifications: { hideComponents: ['comp_btn1'] } }],
      auth: { required: true, roles: ['admin'] },
    }
    expect(PageSchema.safeParse(data).success).toBe(true)
  })
})

describe('ComponentSchema', () => {
  it('accepts valid component', () => {
    expect(ComponentSchema.safeParse(validComponent).success).toBe(true)
  })

  it('requires id, type, props', () => {
    const { props, ...rest } = validComponent
    expect(ComponentSchema.safeParse(rest).success).toBe(false)
  })

  it('accepts recursive children', () => {
    const data = {
      ...validComponent,
      children: [{ id: 'comp_child1', type: 'Text', props: { text: 'hi' } }],
    }
    expect(ComponentSchema.safeParse(data).success).toBe(true)
  })

  it('accepts styles, interactions, responsive, accessibility', () => {
    const data = {
      ...validComponent,
      styles: { base: { display: 'flex' } },
      interactions: { onClick: { type: 'navigate', target: '/home' } },
      responsive: [{ breakpoint: 'md', props: { size: 'lg' } }],
      accessibility: { role: 'button', label: 'Submit' },
      version: '1.0.0',
    }
    expect(ComponentSchema.safeParse(data).success).toBe(true)
  })
})

describe('FlowSchema', () => {
  it('accepts valid flow', () => {
    expect(FlowSchema.safeParse(validFlow).success).toBe(true)
  })

  it('requires id, name, steps, transitions', () => {
    const { name, steps, transitions, ...rest } = validFlow
    expect(FlowSchema.safeParse(rest).success).toBe(false)
  })

  it('accepts triggers, description, version', () => {
    const data = {
      ...validFlow,
      description: 'A flow',
      version: '1.0.0',
      triggers: [{ type: 'pageLoad', source: 'page_home' }],
    }
    expect(FlowSchema.safeParse(data).success).toBe(true)
  })
})

describe('TaskSchema', () => {
  it('accepts valid task', () => {
    expect(TaskSchema.safeParse(validTask).success).toBe(true)
  })

  it('rejects wrong type enum', () => {
    expect(TaskSchema.safeParse({ ...validTask, type: 'invalid' }).success).toBe(false)
  })

  it('rejects wrong status enum', () => {
    expect(TaskSchema.safeParse({ ...validTask, status: 'invalid' }).success).toBe(false)
  })

  it('rejects empty label entries', () => {
    expect(TaskSchema.safeParse({ ...validTask, labels: ['ok', ''] }).success).toBe(false)
  })

  it('accepts optional context', () => {
    const data = { ...validTask, context: { source: 'agent' } }
    expect(TaskSchema.safeParse(data).success).toBe(true)
  })

  it('accepts full task with acceptanceCriteria, estimatedTokens, labels', () => {
    const data = {
      ...validTask,
      acceptanceCriteria: [{ description: 'Login works', met: false }],
      estimatedTokens: { input: 100, output: 200, total: 300 },
      labels: ['frontend', 'auth'],
      affectedScreens: ['page_home'],
      affectedComponents: ['comp_btn1'],
      dependencies: ['task_other'],
    }
    expect(TaskSchema.safeParse(data).success).toBe(true)
  })
})

describe('TemplateSchema', () => {
  it('accepts valid template', () => {
    expect(TemplateSchema.safeParse(validTemplate).success).toBe(true)
  })

  it('requires id, name, version, schema', () => {
    const { id, name, version, schema, ...rest } = validTemplate
    expect(TemplateSchema.safeParse(rest).success).toBe(false)
  })

  it('accepts full template', () => {
    const data = {
      ...validTemplate,
      description: 'A template',
      author: { name: 'Me' },
      license: 'MIT',
      category: 'dashboard',
      tags: ['react'],
      variables: [{ name: 'color', type: 'color', default: '#fff' }],
      dependencies: [{ name: 'react', version: '^18.0.0', type: 'npm' }],
      preview: { image: 'https://example.com/img.png' },
    }
    expect(TemplateSchema.safeParse(data).success).toBe(true)
  })

  it('rejects wrong version pattern', () => {
    expect(TemplateSchema.safeParse({ ...validTemplate, version: 'v1' }).success).toBe(false)
  })

  it('requires schema (canonical required field)', () => {
    const { schema, ...rest } = validTemplate
    expect(TemplateSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects empty tags array entries', () => {
    expect(TemplateSchema.safeParse({ ...validTemplate, tags: ['ok', ''] }).success).toBe(false)
  })

  it('accepts optional importMetadata', () => {
    const data = { ...validTemplate, importMetadata: { source: 'file.json' } }
    expect(TemplateSchema.safeParse(data).success).toBe(true)
  })
})

describe('DesignTokensSchema', () => {
  it('accepts valid design tokens', () => {
    expect(DesignTokensSchema.safeParse(validDesignTokens).success).toBe(true)
  })

  it('accepts empty object (all optional)', () => {
    expect(DesignTokensSchema.safeParse({}).success).toBe(true)
  })

  it('accepts full design tokens with all sections', () => {
    const data = {
      colors: { primary: '#fff', text: { primary: '#000', secondary: '#666' }, border: '#ddd', error: '#f00' },
      typography: {
        fontFamily: { sans: 'Inter' },
        fontSize: { base: '1rem' },
        fontWeight: { normal: 400 },
        lineHeight: { normal: 1.5 },
        letterSpacing: { normal: '0em' },
        heading: { h1: { fontSize: '2rem', fontWeight: 700 } },
      },
      spacing: { sm: '0.25rem' },
      radius: { md: '0.5rem' },
      shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)' },
      breakpoints: { sm: 640 },
      motion: { duration: { fast: '150ms' }, easing: { default: 'ease' }, keyframes: { fadeIn: { '0%': { opacity: '0', scale: '1' } } } },
      zIndex: { base: 0, modal: 1000 },
    }
    expect(DesignTokensSchema.safeParse(data).success).toBe(true)
  })
})

describe('shared projectSchema (lib/validations)', () => {
  it('accepts valid project payload', () => {
    expect(projectSchema.safeParse({ name: 'Test Project' }).success).toBe(true)
  })

  it('accepts optional relational payloads and settings', () => {
    const data = {
      name: 'Test Project',
      pages: [],
      components: [],
      designTokens: { colors: { primary: '#3B82F6' } },
      settings: { theme: 'dark' },
    }
    expect(projectSchema.safeParse(data).success).toBe(true)
  })

  it('rejects missing name', () => {
    expect(projectSchema.safeParse({ description: 'no name' }).success).toBe(false)
  })

  it('rejects unknown keys (strict)', () => {
    expect(projectSchema.safeParse({ name: 'Test', bogus: true }).success).toBe(false)
  })
})

describe('shared pageSchema (lib/validations)', () => {
  it('accepts valid page payload', () => {
    const data = { projectId: 'proj_abc123456', path: '/home', title: 'Home' }
    expect(pageSchema.safeParse(data).success).toBe(true)
  })

  it('accepts optional id, description, and schema payload', () => {
    const data = {
      id: 'page_home',
      projectId: 'proj_abc123456',
      path: '/home',
      title: 'Home',
      description: 'Landing page',
      schema: { components: [] },
    }
    expect(pageSchema.safeParse(data).success).toBe(true)
  })

  it('rejects path not starting with /', () => {
    const data = { projectId: 'proj_abc123456', path: 'home', title: 'Home' }
    expect(pageSchema.safeParse(data).success).toBe(false)
  })

  it('rejects missing projectId (strict on required keys)', () => {
    const data = { path: '/home', title: 'Home' }
    expect(pageSchema.safeParse(data).success).toBe(false)
  })
})

describe('shared componentSchema (lib/validations)', () => {
  it('accepts valid component payload', () => {
    const data = { projectId: 'proj_abc123456', type: 'Button' }
    expect(componentSchema.safeParse(data).success).toBe(true)
  })

  it('accepts optional id, name, and schema payload', () => {
    const data = {
      id: 'comp_btn1',
      projectId: 'proj_abc123456',
      type: 'Button',
      name: 'Submit button',
      schema: { props: { label: 'Click' } },
    }
    expect(componentSchema.safeParse(data).success).toBe(true)
  })

  it('rejects missing type', () => {
    const data = { projectId: 'proj_abc123456' }
    expect(componentSchema.safeParse(data).success).toBe(false)
  })

  it('rejects unknown keys (strict)', () => {
    const data = { projectId: 'proj_abc123456', type: 'Button', bogus: true }
    expect(componentSchema.safeParse(data).success).toBe(false)
  })
})

describe('shared designTokensSchema (lib/validations)', () => {
  it('accepts tokens with palette colors and string breakpoints', () => {
    const data = {
      colors: { primary: '#3B82F6', neutral: { '50': '#fafafa' } },
      typography: { fontFamilies: { sans: 'Inter' } },
      spacing: { sm: '0.25rem' },
      radius: { md: '0.5rem' },
      shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)' },
      breakpoints: { sm: '640px' },
    }
    expect(designTokensSchema.safeParse(data).success).toBe(true)
  })

  it('accepts numeric breakpoints and singular typography keys', () => {
    const data = {
      ...validDesignTokens,
    }
    expect(designTokensSchema.safeParse(data).success).toBe(true)
  })

  it('rejects missing required section (colors)', () => {
    const { colors, ...rest } = validDesignTokens
    expect(designTokensSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects non-object colors', () => {
    const data = { ...validDesignTokens, colors: '#3B82F6' }
    expect(designTokensSchema.safeParse(data).success).toBe(false)
  })
})

describe('shared flowSchema (lib/validations)', () => {
  it('accepts valid flow payload', () => {
    const data = { id: 'flow_checkout', name: 'Checkout' }
    expect(flowSchema.safeParse(data).success).toBe(true)
  })

  it('defaults steps to empty array', () => {
    const result = flowSchema.safeParse({ id: 'flow_checkout', name: 'Checkout' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.steps).toEqual([])
    }
  })

  it('accepts steps, transitions, and triggers', () => {
    const data = {
      id: 'flow_checkout',
      name: 'Checkout',
      steps: [{ id: 'step_start', name: 'Start' }],
      transitions: [{ from: 'step_start', to: 'step_end' }],
      triggers: [{ type: 'pageLoad' }],
    }
    expect(flowSchema.safeParse(data).success).toBe(true)
  })

  it('rejects missing id', () => {
    expect(flowSchema.safeParse({ name: 'Checkout' }).success).toBe(false)
  })
})

describe('shared taskSchema (lib/validations)', () => {
  it('accepts valid task payload', () => {
    const data = { id: 'task_add_login', title: 'Add login', description: 'Implement login' }
    expect(taskSchema.safeParse(data).success).toBe(true)
  })

  it('defaults type, status, and priority', () => {
    const result = taskSchema.safeParse({ id: 'task_add_login', title: 'Add login', description: 'Implement login' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('feature')
      expect(result.data.status).toBe('todo')
      expect(result.data.priority).toBe('medium')
    }
  })

  it('rejects invalid status enum', () => {
    const data = { id: 'task_add_login', title: 'Add login', description: 'Implement login', status: 'invalid' }
    expect(taskSchema.safeParse(data).success).toBe(false)
  })

  it('rejects empty description', () => {
    const data = { id: 'task_add_login', title: 'Add login', description: '' }
    expect(taskSchema.safeParse(data).success).toBe(false)
  })
})

describe('shared templateSchema (lib/validations)', () => {
  it('accepts valid template payload', () => {
    const data = { id: 'tmpl_dashboard', name: 'Dashboard', version: '1.0.0' }
    expect(templateSchema.safeParse(data).success).toBe(true)
  })

  it('accepts description, category, and tags', () => {
    const data = {
      id: 'tmpl_dashboard',
      name: 'Dashboard',
      version: '1.0.0',
      description: 'A template',
      category: 'dashboard',
      tags: ['react'],
    }
    expect(templateSchema.safeParse(data).success).toBe(true)
  })

  it('rejects missing version', () => {
    const data = { id: 'tmpl_dashboard', name: 'Dashboard' }
    expect(templateSchema.safeParse(data).success).toBe(false)
  })

  it('rejects missing name', () => {
    const data = { id: 'tmpl_dashboard', version: '1.0.0' }
    expect(templateSchema.safeParse(data).success).toBe(false)
  })

  it('rejects empty tags array entries', () => {
    const data = { id: 'tmpl_dashboard', name: 'Dashboard', version: '1.0.0', tags: ['ok', ''] }
    expect(templateSchema.safeParse(data).success).toBe(false)
  })

  it('rejects invalid category', () => {
    const data = { id: 'tmpl_dashboard', name: 'Dashboard', version: '1.0.0', category: 'invalid' }
    expect(templateSchema.safeParse(data).success).toBe(false)
  })

  it('rejects non-semver version', () => {
    const data = { id: 'tmpl_dashboard', name: 'Dashboard', version: 'v1' }
    expect(templateSchema.safeParse(data).success).toBe(false)
  })

  it('rejects bad id pattern', () => {
    const data = { id: 'bad-id', name: 'Dashboard', version: '1.0.0' }
    expect(templateSchema.safeParse(data).success).toBe(false)
  })
})

describe('shared mediaSchema (lib/validations)', () => {
  it('accepts valid image payload', () => {
    const data = { src: '/images/hero.png', alt: 'Hero image' }
    expect(mediaSchema.safeParse(data).success).toBe(true)
  })

  it('defaults type to image', () => {
    const result = mediaSchema.safeParse({ src: '/images/hero.png' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('image')
    }
  })

  it('accepts video with dimensions', () => {
    const data = { type: 'video', src: '/media/demo.mp4', width: 1920, height: 1080 }
    expect(mediaSchema.safeParse(data).success).toBe(true)
  })

  it('rejects empty src', () => {
    expect(mediaSchema.safeParse({ src: '' }).success).toBe(false)
  })

  it('rejects non-positive width', () => {
    const data = { type: 'image', src: '/images/hero.png', width: 0 }
    expect(mediaSchema.safeParse(data).success).toBe(false)
  })
})

describe('validation utils (lib/validations)', () => {
  it('validateSchema returns parsed data', () => {
    const data = validateSchema(pageSchema, { projectId: 'proj_abc123456', path: '/', title: 'Home' })
    expect(data.title).toBe('Home')
  })

  it('validateSchema throws on invalid data', () => {
    expect(() => validateSchema(pageSchema, { path: 'nope', title: 'Home' })).toThrow()
  })

  it('validateSchemaSafe returns success and data', () => {
    const result = validateSchemaSafe(pageSchema, { projectId: 'proj_abc123456', path: '/', title: 'Home' })
    expect(result.success).toBe(true)
    expect(result.data?.title).toBe('Home')
  })

  it('validateSchemaSafe returns error on failure', () => {
    const result = validateSchemaSafe(pageSchema, { path: 'nope', title: 'Home' })
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('validateAndTransform maps validated data', () => {
    const out = validateAndTransform(pageSchema, { projectId: 'proj_abc123456', path: '/', title: 'Home' }, (d) => d.title)
    expect(out).toBe('Home')
  })
})

describe('Component prop schemas', () => {
  it('ButtonPropsSchema validates Button props', () => {
    expect(ButtonPropsSchema.safeParse({ variant: 'primary', size: 'md', disabled: false, label: 'Click' }).success).toBe(true)
  })

  it('ButtonPropsSchema rejects invalid variant', () => {
    expect(ButtonPropsSchema.safeParse({ variant: 'invalid' }).success).toBe(false)
  })

  it('InputPropsSchema validates Input props', () => {
    expect(InputPropsSchema.safeParse({ type: 'text', placeholder: 'Enter...', required: true, label: 'Name' }).success).toBe(true)
  })

  it('CardPropsSchema validates Card props', () => {
    expect(CardPropsSchema.safeParse({ variant: 'raised', elevation: 2 }).success).toBe(true)
  })

  it('NavbarPropsSchema validates Navbar props', () => {
    expect(NavbarPropsSchema.safeParse({ logo: { src: '/logo.png' }, sticky: true, transparent: false }).success).toBe(true)
  })

  it('ChartPropsSchema validates Chart props', () => {
    expect(ChartPropsSchema.safeParse({ type: 'line', data: {}, responsive: true }).success).toBe(true)
  })

  it('ChartPropsSchema rejects invalid type', () => {
    expect(ChartPropsSchema.safeParse({ type: 'scatter' }).success).toBe(false)
  })

  it('TablePropsSchema validates Table props', () => {
    expect(TablePropsSchema.safeParse({ columns: [], data: [], sortable: true, filterable: true }).success).toBe(true)
  })
})
