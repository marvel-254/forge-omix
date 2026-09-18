import { z } from 'zod'

export const ProjectIdSchema = z.string().regex(/^proj_[a-zA-Z0-9_-]{8,}$/)
export const PageIdSchema = z.string().regex(/^page_[a-zA-Z0-9_-]{4,}$/)
export const ComponentIdSchema = z.string().regex(/^comp_[a-zA-Z0-9_-]{4,}$/)
export const FlowIdSchema = z.string().regex(/^flow_[a-zA-Z0-9_-]{4,}$/)
export const StepIdSchema = z.string().regex(/^step_[a-zA-Z0-9_-]{3,}$/)
export const TaskIdSchema = z.string().regex(/^task_[a-zA-Z0-9_-]{4,}$/)
export const TemplateIdSchema = z.string().regex(/^tmpl_[a-zA-Z0-9_-]{4,}$/)
export const SemverSchema = z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/)
export const SemverStrictSchema = z.string().regex(/^\d+\.\d+\.\d+$/)
export const LocaleSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/)
export const DateStringSchema = z.string()

// --- Design Tokens ---
export const DesignTokensColorSchema = z.record(z.string())
export const DesignTokensTextSchema = z.object({
  primary: z.string().optional(),
  secondary: z.string().optional(),
  disabled: z.string().optional(),
  inverse: z.string().optional(),
}).passthrough()
export const DesignTokensColorsSchema = z.object({
  primary: z.string().optional(),
  secondary: z.string().optional(),
  accent: z.string().optional(),
  background: z.string().optional(),
  surface: z.string().optional(),
  text: DesignTokensTextSchema.optional(),
  border: z.string().optional(),
  error: z.string().optional(),
  warning: z.string().optional(),
  success: z.string().optional(),
  info: z.string().optional(),
}).passthrough()

export const DesignTokensTypographyFontFamilySchema = z.record(z.string())
export const DesignTokensTypographyFontSizeSchema = z.record(z.string())
export const DesignTokensTypographyFontWeightSchema = z.record(z.union([z.string(), z.number()]))
export const DesignTokensTypographyLineHeightSchema = z.record(z.union([z.string(), z.number()]))
export const DesignTokensTypographyLetterSpacingSchema = z.record(z.string())

export const DesignTokensHeadingSchema = z.object({
  h1: z.object({
    fontSize: z.string().optional(),
    fontWeight: z.union([z.string(), z.number()]).optional(),
    lineHeight: z.union([z.string(), z.number()]).optional(),
    letterSpacing: z.string().optional(),
  }).passthrough().optional(),
  h2: z.object({
    fontSize: z.string().optional(),
    fontWeight: z.union([z.string(), z.number()]).optional(),
    lineHeight: z.union([z.string(), z.number()]).optional(),
    letterSpacing: z.string().optional(),
  }).passthrough().optional(),
  h3: z.object({
    fontSize: z.string().optional(),
    fontWeight: z.union([z.string(), z.number()]).optional(),
    lineHeight: z.union([z.string(), z.number()]).optional(),
  }).passthrough().optional(),
  h4: z.object({
    fontSize: z.string().optional(),
    fontWeight: z.union([z.string(), z.number()]).optional(),
  }).passthrough().optional(),
  h5: z.object({
    fontSize: z.string().optional(),
    fontWeight: z.union([z.string(), z.number()]).optional(),
  }).passthrough().optional(),
  h6: z.object({
    fontSize: z.string().optional(),
    fontWeight: z.union([z.string(), z.number()]).optional(),
  }).passthrough().optional(),
}).passthrough()

export const DesignTokensTypographySchema = z.object({
  fontFamily: DesignTokensTypographyFontFamilySchema.optional(),
  fontSize: DesignTokensTypographyFontSizeSchema.optional(),
  fontWeight: DesignTokensTypographyFontWeightSchema.optional(),
  lineHeight: DesignTokensTypographyLineHeightSchema.optional(),
  letterSpacing: DesignTokensTypographyLetterSpacingSchema.optional(),
  heading: DesignTokensHeadingSchema.optional(),
}).passthrough()

export const DesignTokensSpacingSchema = z.record(z.string())
export const DesignTokensRadiusSchema = z.record(z.string())
export const DesignTokensShadowsSchema = z.record(z.string())
export const DesignTokensBreakpointsSchema = z.record(z.number())

export const DesignTokensMotionDurationSchema = z.record(z.string())
export const DesignTokensMotionEasingSchema = z.record(z.string())
export const DesignTokensMotionKeyframesSchema = z.record(
  z.record(z.record(z.string()))
)

export const DesignTokensMotionSchema = z.object({
  duration: DesignTokensMotionDurationSchema.optional(),
  easing: DesignTokensMotionEasingSchema.optional(),
  keyframes: DesignTokensMotionKeyframesSchema.optional(),
}).passthrough()

export const DesignTokensZIndexSchema = z.record(z.number())

export const DesignTokensSchema = z.object({
  colors: DesignTokensColorsSchema.optional(),
  typography: DesignTokensTypographySchema.optional(),
  spacing: DesignTokensSpacingSchema.optional(),
  radius: DesignTokensRadiusSchema.optional(),
  shadows: DesignTokensShadowsSchema.optional(),
  breakpoints: DesignTokensBreakpointsSchema.optional(),
  motion: DesignTokensMotionSchema.optional(),
  zIndex: DesignTokensZIndexSchema.optional(),
}).passthrough()

export type DesignTokensSchema = z.infer<typeof DesignTokensSchema>

export interface InteractionHandler {
  type: 'navigate' | 'apiCall' | 'stateUpdate' | 'emit' | 'custom'
  target?: string
  params?: Record<string, unknown>
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  condition?: string
}

// --- Component ---
export const InteractionHandlerSchema = z.object({
  type: z.enum(['navigate', 'apiCall', 'stateUpdate', 'emit', 'custom']),
  target: z.string().optional(),
  params: z.record(z.unknown()).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  condition: z.string().optional(),
}).passthrough()

export const ComponentStylesBaseSchema = z.record(z.union([z.string(), z.number()]))
export const ComponentStylesVariantsSchema = z.record(
  z.record(z.union([z.string(), z.number()]))
)
export const ComponentStylesResponsiveSchema = z.record(
  z.record(z.union([z.string(), z.number()]))
)

export const ComponentStylesSchema = z.object({
  base: ComponentStylesBaseSchema.optional(),
  variants: ComponentStylesVariantsSchema.optional(),
  responsive: ComponentStylesResponsiveSchema.optional(),
}).passthrough()

export const ComponentInteractionSchema = z.object({
  onClick: InteractionHandlerSchema.optional(),
  onHover: InteractionHandlerSchema.optional(),
  onFocus: InteractionHandlerSchema.optional(),
  onLoad: InteractionHandlerSchema.optional(),
  onSubmit: InteractionHandlerSchema.optional(),
  custom: z.record(InteractionHandlerSchema).optional(),
}).passthrough()

export const ComponentResponsiveBreakpointSchema = z.object({
  breakpoint: z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  props: z.record(z.unknown()).optional(),
  styles: z.record(z.union([z.string(), z.number()])).optional(),
  hidden: z.boolean().optional(),
}).passthrough()

export const ComponentKeyboardShortcutSchema = z.object({
  key: z.string(),
  action: z.string(),
  modifier: z.enum(['ctrl', 'alt', 'shift', 'meta']).optional(),
}).passthrough()

export const ComponentAccessibilitySchema = z.object({
  role: z.string().optional(),
  label: z.string().optional(),
  labelledBy: z.string().optional(),
  describedBy: z.string().optional(),
  tabIndex: z.number().optional(),
  keyboardShortcuts: z.array(ComponentKeyboardShortcutSchema).optional(),
}).passthrough()

export interface ComponentSchemaDef {
  id: string
  type: string
  name?: string
  props: Record<string, unknown>
  children?: ComponentSchemaDef[]
  styles?: {
    base?: Record<string, string | number>
    variants?: Record<string, Record<string, string | number>>
    responsive?: Record<string, Record<string, string | number>>
  }
  interactions?: {
    onClick?: InteractionHandler
    onHover?: InteractionHandler
    onFocus?: InteractionHandler
    onLoad?: InteractionHandler
    onSubmit?: InteractionHandler
    [key: string]: InteractionHandler | undefined
  }
  responsive?: Array<{
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    props?: Record<string, unknown>
    styles?: Record<string, string | number>
    hidden?: boolean
  }>
  accessibility?: {
    role?: string
    label?: string
    labelledBy?: string
    describedBy?: string
    tabIndex?: number
    keyboardShortcuts?: Array<{
      key: string
      action: string
      modifier?: 'ctrl' | 'alt' | 'shift' | 'meta'
    }>
  }
  version?: string
}

export const ComponentSchema: z.ZodType<ComponentSchemaDef> = z.object({
  id: ComponentIdSchema,
  type: z.string().min(1).max(100),
  name: z.string().max(100).optional(),
  props: z.record(z.unknown()),
  children: z.array(z.lazy(() => ComponentSchema)).optional(),
  styles: ComponentStylesSchema.optional(),
  interactions: ComponentInteractionSchema.optional(),
  responsive: z.array(ComponentResponsiveBreakpointSchema).optional(),
  accessibility: ComponentAccessibilitySchema.optional(),
  version: SemverStrictSchema.optional(),
}).passthrough() as z.ZodType<ComponentSchemaDef>

export type ComponentSchema = ComponentSchemaDef

// --- Page ---
export const PageLayoutSchema = z.object({
  type: z.enum(['default', 'sidebar', 'fullscreen', 'blank', 'auth']).optional(),
  containerWidth: z.enum(['full', 'contained', 'narrow']).optional(),
  padding: z.union([z.string(), z.number()]).optional(),
}).passthrough()

export const PageMetaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ogImage: z.string().url().optional(),
  noindex: z.boolean().optional(),
}).passthrough()

export const PageResponsiveRulesSchema = z.object({
  breakpoint: z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  modifications: z.object({
    hideComponents: z.array(z.string()).optional(),
    showComponents: z.array(z.string()).optional(),
    reorderComponents: z.array(z.string()).optional(),
    layoutOverride: z.lazy(() => PageLayoutOverrideSchema).optional(),
  }).optional(),
}).passthrough()

export const PageLayoutOverrideSchema = z.object({
  type: z.enum(['default', 'sidebar', 'fullscreen', 'blank', 'auth']).optional(),
  containerWidth: z.enum(['full', 'contained', 'narrow']).optional(),
}).passthrough()

export const PageAuthSchema = z.object({
  required: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
}).passthrough()

export const PageSchema = z.object({
  id: PageIdSchema,
  path: z.string().regex(/^\//),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  components: z.array(z.lazy(() => ComponentSchema)),
  layout: PageLayoutSchema.optional(),
  meta: PageMetaSchema.optional(),
  responsiveRules: z.array(PageResponsiveRulesSchema).optional(),
  auth: PageAuthSchema.optional(),
}).passthrough()

export type PageSchema = z.infer<typeof PageSchema>

// --- Flow ---
export const FlowStepValidationRuleSchema = z.object({
  field: z.string().optional(),
  rule: z.enum(['required', 'email', 'minLength', 'maxLength', 'pattern', 'custom']).optional(),
  value: z.unknown().optional(),
  message: z.string().optional(),
}).passthrough()

export const FlowStepValidationSchema = z.object({
  required: z.boolean().optional(),
  rules: z.array(FlowStepValidationRuleSchema).optional(),
}).passthrough()

export const FlowStepSchema = z.object({
  id: StepIdSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['page', 'action', 'decision', 'api', 'notification', 'wait', 'end']).optional(),
  target: z.string().optional(),
  isStart: z.boolean().optional(),
  isEnd: z.boolean().optional(),
  validation: FlowStepValidationSchema.optional(),
}).passthrough()

export const FlowTransitionSchema = z.object({
  id: z.string().optional(),
  from: z.string(),
  to: z.string(),
  condition: z.string().optional(),
  label: z.string().optional(),
  trigger: z.enum(['auto', 'user', 'event', 'timeout', 'api']).optional(),
  order: z.number().int().min(0).optional(),
}).passthrough()

export const FlowTriggerSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['pageLoad', 'userAction', 'apiResponse', 'timer', 'webhook', 'stateChange', 'error']),
  source: z.string().optional(),
  condition: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
}).passthrough()

export const FlowSchema = z.object({
  id: FlowIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  version: SemverStrictSchema.optional(),
  steps: z.array(FlowStepSchema).min(1),
  transitions: z.array(FlowTransitionSchema),
  triggers: z.array(FlowTriggerSchema).optional(),
}).passthrough()

export type FlowSchema = z.infer<typeof FlowSchema>

// --- Task ---
export const TaskAcceptanceCriterionSchema = z.object({
  description: z.string().min(1),
  met: z.boolean().optional(),
}).passthrough()

export const TaskEstimatedTokensSchema = z.object({
  input: z.number().int().min(0).optional(),
  output: z.number().int().min(0).optional(),
  total: z.number().int().min(0).optional(),
}).passthrough()

export const TaskSchema = z.object({
  id: TaskIdSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: z.enum(['feature', 'fix', 'refactor', 'style', 'test', 'docs', 'chore', 'research', 'design', 'integration']),
  status: z.enum(['backlog', 'todo', 'in-progress', 'review', 'done', 'cancelled']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  dependencies: z.array(TaskIdSchema).optional(),
  affectedScreens: z.array(PageIdSchema).optional(),
  affectedComponents: z.array(ComponentIdSchema).optional(),
  acceptanceCriteria: z.array(TaskAcceptanceCriterionSchema).optional(),
  estimatedTokens: TaskEstimatedTokensSchema.optional(),
  assignee: z.string().optional(),
  labels: z.array(z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/).max(30)).max(20).optional(),
  notes: z.string().max(5000).optional(),
  context: z.record(z.unknown()).optional(),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
  completedAt: DateStringSchema.optional(),
  version: SemverStrictSchema.optional(),
}).passthrough()

export type TaskSchema = z.infer<typeof TaskSchema>

// --- Template ---
export const TemplateAuthorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  url: z.string().url().optional(),
}).passthrough()

export const TemplateVariableSchema = z.object({
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  type: z.enum(['string', 'number', 'boolean', 'color', 'image', 'component', 'array', 'object']),
  description: z.string().optional(),
  default: z.unknown().optional(),
  required: z.boolean().optional(),
  options: z.array(z.unknown()).optional(),
}).passthrough()

export const TemplateDependencySchema = z.object({
  name: z.string(),
  version: z.string(),
  type: z.enum(['npm', 'template', 'component']).optional(),
}).passthrough()

export const TemplatePreviewSchema = z.object({
  image: z.string().url().optional(),
  demoUrl: z.string().url().optional(),
}).passthrough()

export const TemplateSchema = z.object({
  id: TemplateIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  version: SemverSchema,
  author: TemplateAuthorSchema.optional(),
  license: z.enum(['MIT', 'Apache-2.0', 'BSD-3-ISC', 'GPL-3.0', 'LGPL-3.0', 'MPL-2.0', 'Unlicense', 'Proprietary']).optional(),
  category: z.enum(['landing', 'dashboard', 'e-commerce', 'blog', 'portfolio', 'auth', 'form', 'layout', 'component', 'page', 'flow', 'other']).optional(),
  tags: z.array(z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/).max(30)).max(20).optional(),
  variables: z.array(TemplateVariableSchema).optional(),
  dependencies: z.array(TemplateDependencySchema).optional(),
  preview: TemplatePreviewSchema.optional(),
  schema: z.record(z.unknown()),
  importMetadata: z.record(z.unknown()).optional(),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
}).passthrough()

export type TemplateSchema = z.infer<typeof TemplateSchema>

// --- Project ---
export const ProjectSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  defaultLocale: LocaleSchema.optional(),
  supportedLocales: z.array(LocaleSchema).optional(),
  basePath: z.string().regex(/^\//).optional(),
}).passthrough()

export const ProjectSchema = z.object({
  id: ProjectIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  version: SemverSchema,
  pages: z.array(PageSchema),
  components: z.array(ComponentSchema),
  flows: z.array(FlowSchema).optional(),
  designTokens: DesignTokensSchema.optional(),
  tasks: z.array(TaskSchema).optional(),
  templates: z.array(TemplateSchema).optional(),
  settings: ProjectSettingsSchema.optional(),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
}).passthrough()

export type ProjectSchema = z.infer<typeof ProjectSchema>

// --- Validation utilities ---
export interface ValidationResult<T> {
  valid: boolean
  data?: T
  errors?: z.ZodError
}

export function validate<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)
  if (result.success) {
    return { valid: true, data: result.data }
  }
  return { valid: false, errors: result.error }
}

export function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (result.success) {
    return result.data
  }
  throw result.error
}

export function formatErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join('.') || 'root'
    return `${path}: ${issue.message}`
  })
}

export * from './components'

export function isNonEmptyArray<T>(arr: T[] | undefined | null): arr is T[] {
  return Array.isArray(arr) && arr.length > 0
}

export {
  ButtonPropsSchema,
  InputPropsSchema,
  CardPropsSchema,
  NavbarPropsSchema,
  ChartPropsSchema,
  TablePropsSchema,
  componentPropSchemas,
} from './components'

