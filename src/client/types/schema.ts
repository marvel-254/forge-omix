import type {
  ProjectSchema,
  PageSchema,
  ComponentSchema,
  ComponentSchemaDef,
  TaskSchema,
  FlowSchema,
  TemplateSchema,
  DesignTokensSchema,
  InteractionHandler,
} from '@server/validation'
import type {
  Flow as FlowStepShape,
  FlowStep as FlowStepSchema,
  FlowTransition as FlowTransitionSchema,
  FlowTrigger as FlowTriggerSchema,
} from '@server/types/schema'

export type {
  ProjectSchema,
  PageSchema,
  ComponentSchema,
  ComponentSchemaDef,
  TaskSchema,
  FlowSchema,
  TemplateSchema,
  DesignTokensSchema,
  InteractionHandler,
}

// Flow sub-schemas are values in @server/validation; their shapes come from
// the canonical server type definitions.
export type {
  FlowStepShape,
  FlowStepSchema,
  FlowTransitionSchema,
  FlowTriggerSchema,
}

export type Project = ProjectSchema
export type Page = PageSchema
export type Component = ComponentSchema
export type ComponentDef = ComponentSchemaDef
export type Task = TaskSchema
export type Flow = FlowSchema
export type Step = FlowStepSchema
export type Transition = FlowTransitionSchema
export type Trigger = FlowTriggerSchema
export type Template = TemplateSchema
export type DesignTokens = DesignTokensSchema
