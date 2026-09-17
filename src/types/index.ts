/**
 * Shared type contracts for the forge@omix builder.
 * Used by both server (Hono) and client code.
 *
 * Domain models are re-exported from the canonical server schema definitions.
 * DesignTokens and FlowStep are client-facing supersets that also support
 * palette-style colors (colors.primary[500]) and flow-editor positioning.
 */

// --- API envelopes ---

/** Standard API envelope: success responses carry `data`, failures carry `error`. */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

/** Pagination metadata for list endpoints. */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Standard paginated envelope. */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination?: PaginationMeta
}

// --- Domain model re-exports (canonical shapes from src/server/types/schema) ---

export type {
  Project,
  Page,
  Component,
  Task,
  Template,
  TemplateVariable,
  FlowTransition,
  FlowTrigger,
  InteractionHandler,
} from '../server/types/schema'

export type { Component as ComponentDef } from '../server/types/schema'

// --- Design Tokens (client-facing superset) ---

/** A color token: a single CSS color or a palette of shades (50–950). */
export type ColorValue = string | Record<string, string>

export interface DesignTokenTextColors {
  primary?: string
  secondary?: string
  disabled?: string
  inverse?: string
  [key: string]: string | undefined
}

export interface DesignTokenColors {
  primary?: ColorValue
  secondary?: ColorValue
  accent?: ColorValue
  background?: string
  surface?: string
  text?: DesignTokenTextColors
  border?: string
  error?: string
  warning?: string
  success?: string
  info?: string
  neutral?: Record<string, string>
  [key: string]: ColorValue | DesignTokenTextColors | Record<string, string> | undefined
}

export interface DesignTokenTypography {
  fontFamily?: Record<string, string>
  fontFamilies?: Record<string, string>
  fontSize?: Record<string, string>
  fontSizes?: Record<string, string>
  fontWeight?: Record<string, string | number>
  fontWeights?: Record<string, string | number>
  lineHeight?: Record<string, string | number>
  lineHeights?: Record<string, string | number>
  letterSpacing?: Record<string, string>
  heading?: Record<string, Record<string, string | number>>
  [key: string]:
    | Record<string, string>
    | Record<string, string | number>
    | Record<string, Record<string, string | number>>
    | undefined
}

export interface DesignTokens {
  colors: DesignTokenColors
  typography: DesignTokenTypography
  spacing: Record<string, string>
  radius: Record<string, string>
  shadows: Record<string, string>
  breakpoints: Record<string, string | number>
  motion?: {
    duration?: Record<string, string>
    easing?: Record<string, string>
    keyframes?: Record<string, Record<string, string>>
  }
  zIndex?: Record<string, number>
  [key: string]: unknown
}

// --- Flow (extended for the visual flow editor) ---

export interface FlowStepPosition {
  x: number
  y: number
}

export interface FlowStep {
  id: string
  name: string
  description?: string
  type?:
    | 'page'
    | 'action'
    | 'decision'
    | 'api'
    | 'notification'
    | 'wait'
    | 'end'
    | 'trigger'
  target?: string
  isStart?: boolean
  isEnd?: boolean
  /** Flow-editor extras */
  config?: Record<string, unknown>
  position?: FlowStepPosition
  next?: string[]
  [key: string]: unknown
}

export interface Flow {
  id: string
  name: string
  description?: string
  version?: string
  steps: FlowStep[]
  transitions?: Array<{
    id?: string
    from: string
    to: string
    condition?: string
    label?: string
    trigger?: 'auto' | 'user' | 'event' | 'timeout' | 'api'
    order?: number
  }>
  triggers?: Array<{
    id?: string
    type: 'pageLoad' | 'userAction' | 'apiResponse' | 'timer' | 'webhook' | 'stateChange' | 'error'
    source?: string
    condition?: string
    payload?: Record<string, unknown>
  }>
  [key: string]: unknown
}
