import { db } from '../db'
import {
  projects,
  pages,
  components,
  designTokens,
  flows,
} from '../db/schema'
import { eq } from 'drizzle-orm'
import type { DesignTokens } from '../../types'

/**
 * Aggregate project persistence.
 *
 * The canonical project (universal schema) is a composite document, while the
 * database is relational. These helpers serialize the composite into rows
 * (splitProject) and reassemble rows back into the composite (reassembleProject).
 */

/** Match the API projectSchema (lib/validations) — what clients may send. */
export interface ServerProjectPayload {
  id?: string
  name: string
  description?: string | null
  version?: string
  framework?: string
  cssStrategy?: string
  routerMode?: string
  pages?: Array<Record<string, unknown>>
  components?: Array<Record<string, unknown>>
  flows?: Array<Record<string, unknown>>
  designTokens?: Record<string, unknown>
  [key: string]: unknown
}

/** Strip keys the relational columns cannot store (managed through child rows). */
const RELATIONAL_KEYS = new Set([
  'pages',
  'components',
  'flows',
  'tasks',
  'templates',
  'designTokens',
])

/** Columns the projects table actually accepts. */
const PROJECT_COLUMNS = new Set(['name', 'description', 'version', 'framework', 'cssStrategy', 'routerMode', 'settings'])

export function pickProjectColumns(payload: ServerProjectPayload) {
  const columns: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (RELATIONAL_KEYS.has(key) || key === 'id' || key === 'createdAt' || key === 'updatedAt') continue
    if (!PROJECT_COLUMNS.has(key)) continue
    columns[key] = value
  }
  return columns
}

/** Persist a canonical project's relational payloads as child rows. */
export async function writeProjectChildren(
  projectId: string,
  payload: ServerProjectPayload
): Promise<void> {
  const now = new Date()

  // --- Pages ---
  if (Array.isArray(payload.pages)) {
    await db.delete(pages).where(eq(pages.projectId, projectId))
    for (const raw of payload.pages) {
      const page = raw as Record<string, unknown>
      if (typeof page.id !== 'string') continue
      // Everything except the projected columns lives in the `schema` JSON column.
      const { id, projectId: _pid, path, title, description, ...rest } = page
      await db.insert(pages).values({
        id,
        projectId,
        path: typeof path === 'string' ? path : '/',
        title: typeof title === 'string' ? title : id,
        description: typeof description === 'string' ? description : null,
        schema: rest,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // --- Components (project-level library) ---
  if (Array.isArray(payload.components)) {
    await db.delete(components).where(eq(components.projectId, projectId))
    for (const raw of payload.components) {
      const component = raw as Record<string, unknown>
      if (typeof component.id !== 'string') continue
      const { id, projectId: _pid, type, name, ...rest } = component
      await db.insert(components).values({
        id,
        projectId,
        type: typeof type === 'string' ? type : 'unknown',
        name: typeof name === 'string' ? name : null,
        schema: rest,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // --- Flows ---
  if (Array.isArray(payload.flows)) {
    await db.delete(flows).where(eq(flows.projectId, projectId))
    for (const raw of payload.flows) {
      const flow = raw as Record<string, unknown>
      if (typeof flow.id !== 'string') continue
      const { id, projectId: _pid, name, description, version, steps, transitions, triggers } = flow
      await db.insert(flows).values({
        id,
        projectId,
        name: typeof name === 'string' ? name : id,
        description: typeof description === 'string' ? description : null,
        version: typeof version === 'string' ? version : '1.0.0',
        steps: Array.isArray(steps) ? steps : [],
        transitions: Array.isArray(transitions) ? transitions : null,
        triggers: Array.isArray(triggers) ? triggers : null,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // --- Design tokens ---
  if (payload.designTokens && typeof payload.designTokens === 'object') {
    const tokens = payload.designTokens as DesignTokens
    const { colors, typography, spacing, radius, shadows, breakpoints, motion, zIndex } = tokens
    await db.delete(designTokens).where(eq(designTokens.projectId, projectId))
    await db.insert(designTokens).values({
      id: `tok_${projectId}`,
      projectId,
      version: '1.0.0',
      colors: (colors ?? null) as Record<string, unknown> | null,
      typography: (typography ?? null) as Record<string, unknown> | null,
      spacing: (spacing ?? null) as Record<string, unknown> | null,
      radius: (radius ?? null) as Record<string, unknown> | null,
      shadows: (shadows ?? null) as Record<string, unknown> | null,
      breakpoints: (breakpoints ?? null) as Record<string, unknown> | null,
      motion: (motion ?? null) as Record<string, unknown> | null,
      zIndex: (zIndex ?? null) as Record<string, unknown> | null,
      createdAt: now,
      updatedAt: now,
    })
  }
}

/** Reassemble the canonical project from its rows. Returns null if absent. */
export async function reassembleProject(projectId: string) {
  const project = await db.select().from(projects).where(eq(projects.id, projectId)).get()
  if (!project) return null

  const [pageRows, componentRows, flowRows, tokenRows] = await Promise.all([
    db.select().from(pages).where(eq(pages.projectId, projectId)).all(),
    db.select().from(components).where(eq(components.projectId, projectId)).all(),
    db.select().from(flows).where(eq(flows.projectId, projectId)).all(),
    db.select().from(designTokens).where(eq(designTokens.projectId, projectId)).all(),
  ])

  const composite: Record<string, unknown> = {
    id: project.id,
    name: project.name,
    description: project.description ?? undefined,
    version: project.version,
    framework: project.framework,
    cssStrategy: project.cssStrategy,
    routerMode: project.routerMode,
    ...(project.settings ? { settings: project.settings } : {}),
    createdAt: project.createdAt?.toISOString(),
    updatedAt: project.updatedAt?.toISOString(),
    pages: pageRows.map((row) => ({
      ...(row.schema as Record<string, unknown>),
      id: row.id,
      path: row.path,
      title: row.title,
      ...(row.description ? { description: row.description } : {}),
      components: ((row.schema as Record<string, unknown>).components as unknown[]) ?? [],
    })),
    components: componentRows.map((row) => ({
      ...(row.schema as Record<string, unknown>),
      id: row.id,
      type: row.type,
      ...(row.name ? { name: row.name } : {}),
    })),
    flows: flowRows.map((row) => ({
      id: row.id,
      name: row.name,
      ...(row.description ? { description: row.description } : {}),
      version: row.version,
      steps: row.steps ?? [],
      ...(row.transitions ? { transitions: row.transitions } : {}),
      ...(row.triggers ? { triggers: row.triggers } : {}),
    })),
  }

  const tokenRow = tokenRows[0]
  if (tokenRow) {
    const tokens: Record<string, unknown> = {
      ...(tokenRow.colors ? { colors: tokenRow.colors } : {}),
      ...(tokenRow.typography ? { typography: tokenRow.typography } : {}),
      ...(tokenRow.spacing ? { spacing: tokenRow.spacing } : {}),
      ...(tokenRow.radius ? { radius: tokenRow.radius } : {}),
      ...(tokenRow.shadows ? { shadows: tokenRow.shadows } : {}),
      ...(tokenRow.breakpoints ? { breakpoints: tokenRow.breakpoints } : {}),
      ...(tokenRow.motion ? { motion: tokenRow.motion } : {}),
      ...(tokenRow.zIndex ? { zIndex: tokenRow.zIndex } : {}),
    }
    composite.designTokens = tokens
  }

  return composite
}
