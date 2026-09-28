import type { Project } from '../types/schema'

/**
 * Prompt engineering (docs/09 §9.4): system-prompt builder with project
 * context plus the V1 feature prompt templates.
 */

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export interface PromptContext {
  project: Project
  currentPageId?: string
  userQuery: string
}

export function buildSystemPrompt({ project, currentPageId, userQuery }: PromptContext): string {
  const record = asRecord(project)
  const pages = Array.isArray(record.pages) ? record.pages : []
  const tokens = asRecord(record.designTokens)
  const page = pages.find((p) => asRecord(p).id === currentPageId)
  const parts = [
    'You are an AI design assistant for Omix Builder.',
    'You help users create, modify, and generate web applications.',
    '',
    '## Project Context',
    `Project: ${String(record.name ?? 'Untitled')}`,
    `Total pages: ${pages.length}`,
    currentPageId && page
      ? `Current page: ${String(asRecord(page).path ?? '')} (${String(asRecord(page).title ?? '')})`
      : 'Current page: none',
    '',
    '## Design System',
    `Colors: ${JSON.stringify(asRecord(tokens.colors))}`,
    `Typography: ${JSON.stringify(asRecord(tokens.typography))}`,
    '',
    '## User Request',
    userQuery,
    '',
    '## Rules',
    '1. Always maintain design token references',
    '2. All components must be accessible',
    '3. Responsive design is required',
    '4. Use semantic HTML',
    '5. No inline styles — use Tailwind classes',
    '',
    '## Component Operations',
    'To add a component or page, reply with a fenced json block shaped like:',
    '{"action":"add-component","component":{"id":"comp_change_me","type":"Button","props":{"label":"Hi"}}}',
    'or {"action":"add-page","page":{"id":"page_change_me","path":"/x","title":"X","components":[]}}.',
    'The builder assigns fresh ids and validates before applying.',
  ]
  return parts.join('\n')
}

export const componentPrompts = {
  generate: (description: string, context: { designTokens: unknown; componentNames: string[] }) => `
Generate a React component based on this description:
"${description}"

Context:
- Design tokens: ${JSON.stringify(context.designTokens)}
- Existing components: ${context.componentNames.join(', ')}
- Framework: React + TypeScript + Tailwind

Requirements:
- Export as default
- Use design token references for colors, spacing
- Include ARIA attributes
- Support className prop for composition
- Include TypeScript interface for props
`,
  modify: (componentId: string, instruction: string) => `
Modify component ${componentId} per this instruction:
"${instruction}"

Rules:
- Preserve all existing functionality
- Maintain accessibility attributes
- Keep TypeScript types accurate
  `,
  analyze: (schema: string) => `
Analyze this component schema for issues:
${schema}

Check for:
- Accessibility violations
- Missing ARIA attributes
- Insufficient color contrast
- Semantic HTML issues
- Responsive design gaps
  `,
};
