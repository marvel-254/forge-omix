export interface DesignTokens {
  version?: string
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    surface?: string
    text?: {
      primary?: string
      secondary?: string
      disabled?: string
      inverse?: string
    }
    border?: string
    error?: string
    warning?: string
    success?: string
    info?: string
    [key: string]: string | Record<string, string> | undefined
  }
  typography?: {
    fontFamily?: Record<string, string>
    fontSize?: Record<string, string>
    lineHeight?: Record<string, string | number>
    fontWeight?: Record<string, string | number>
    letterSpacing?: Record<string, string>
    heading?: Record<string, Record<string, string | number>>
  }
  spacing?: Record<string, string>
  radius?: Record<string, string>
  shadows?: Record<string, string>
  breakpoints?: Record<string, number>
  motion?: {
    duration?: Record<string, string>
    easing?: Record<string, string>
    keyframes?: Record<string, Record<string, Record<string, string>>>
  }
  zIndex?: Record<string, number>
}

export interface Component {
  id: string
  type: string
  name?: string
  props: Record<string, unknown>
  children?: Component[]
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

export interface InteractionHandler {
  type: 'navigate' | 'apiCall' | 'stateUpdate' | 'emit' | 'custom'
  target?: string
  params?: Record<string, unknown>
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  condition?: string
}

export interface Page {
  id: string
  path: string
  title: string
  description?: string
  components: Component[]
  layout?: {
    type?: 'default' | 'sidebar' | 'fullscreen' | 'blank' | 'auth'
    containerWidth?: 'full' | 'contained' | 'narrow'
    padding?: string | number
  }
  meta?: {
    title?: string
    description?: string
    ogImage?: string
    noindex?: boolean
  }
  responsiveRules?: Array<{
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    modifications?: {
      hideComponents?: string[]
      showComponents?: string[]
      reorderComponents?: string[]
      layoutOverride?: {
        type?: 'default' | 'sidebar' | 'fullscreen' | 'blank' | 'auth'
        containerWidth?: 'full' | 'contained' | 'narrow'
      }
    }
  }>
  auth?: {
    required?: boolean
    roles?: string[]
  }
}

export interface Flow {
  id: string
  name: string
  description?: string
  version?: string
  steps: FlowStep[]
  transitions: FlowTransition[]
  triggers?: FlowTrigger[]
}

export interface FlowStep {
  id: string
  name: string
  description?: string
  type?: 'page' | 'action' | 'decision' | 'api' | 'notification' | 'wait' | 'end'
  target?: string
  isStart?: boolean
  isEnd?: boolean
  validation?: {
    required?: boolean
    rules?: Array<{
      field?: string
      rule?: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
      value?: unknown
      message?: string
    }>
  }
}

export interface FlowTransition {
  id?: string
  from: string
  to: string
  condition?: string
  label?: string
  trigger?: 'auto' | 'user' | 'event' | 'timeout' | 'api'
  order?: number
}

export interface FlowTrigger {
  id?: string
  type: 'pageLoad' | 'userAction' | 'apiResponse' | 'timer' | 'webhook' | 'stateChange' | 'error'
  source?: string
  condition?: string
  payload?: Record<string, unknown>
}

export interface Task {
  id: string
  title: string
  description: string
  type: 'feature' | 'fix' | 'refactor' | 'style' | 'test' | 'docs' | 'chore' | 'research' | 'design' | 'integration'
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled'
  priority: 'critical' | 'high' | 'medium' | 'low'
  dependencies?: string[]
  affectedScreens?: string[]
  affectedComponents?: string[]
  acceptanceCriteria?: Array<{ description: string; met?: boolean }>
  estimatedTokens?: {
    input?: number
    output?: number
    total?: number
  }
  assignee?: string
  labels?: string[]
  notes?: string
  context?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
  completedAt?: string
  version?: string
}

export interface Template {
  id: string
  name: string
  version: string
  description?: string
  author?: {
    name: string
    email?: string
    url?: string
  }
  license?: 'MIT' | 'Apache-2.0' | 'BSD-3-ISC' | 'GPL-3.0' | 'LGPL-3.0' | 'MPL-2.0' | 'Unlicense' | 'Proprietary'
  category?: 'landing' | 'dashboard' | 'e-commerce' | 'blog' | 'portfolio' | 'auth' | 'form' | 'layout' | 'component' | 'page' | 'flow' | 'other'
  tags?: string[]
  variables?: TemplateVariable[]
  dependencies?: Array<{
    name: string
    version: string
    type?: 'npm' | 'template' | 'component'
  }>
  preview?: {
    image?: string
    demoUrl?: string
  }
  schema: Record<string, unknown>
  importMetadata?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface TemplateVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'color' | 'image' | 'component' | 'array' | 'object'
  description?: string
  default?: unknown
  required?: boolean
  options?: unknown[]
}

export interface Project {
  id: string
  name: string
  description?: string
  version: string
  pages: Page[]
  components: Component[]
  flows?: Flow[]
  designTokens?: DesignTokens
  tasks?: Task[]
  templates?: Template[]
  settings?: {
    theme?: 'light' | 'dark' | 'system'
    defaultLocale?: string
    supportedLocales?: string[]
    basePath?: string
  }
  createdAt?: string
  updatedAt?: string
}
