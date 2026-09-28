import { describe, it, expect, afterEach, vi } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { sql } from 'drizzle-orm'

async function applyMigration(db: { run: (query: unknown) => Promise<unknown> }, file: string) {
  const source = await readFile(resolve('src/server/db/migrations', file), 'utf8')
  for (const statement of source.split(';').map((part) => part.trim()).filter(Boolean)) {
    await db.run(sql.raw(statement))
  }
}

describe('account migrations', () => {
  let root = ''

  afterEach(async () => {
    delete process.env.DATABASE_URL
    if (root) await rm(root, { recursive: true, force: true })
    root = ''
    vi.resetModules()
  })

  it('applies account tables on a fresh database', async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-migration-fresh-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { db } = await import('@server/db')
    const { SchemaVersionManager } = await import('@server/services/versionService')
    expect(await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))).toBe(8)
    const tables = await db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`)
    expect(tables.map((table) => table.name)).toEqual(expect.arrayContaining(['accounts', 'sessions', 'projects', 'feedback']))
  })

  it('upgrades an existing pre-account database without dropping project data', async () => {
    root = await mkdtemp(join(tmpdir(), 'omix-migration-existing-'))
    process.env.DATABASE_URL = `file:${join(root, 'test.db')}`
    const { db } = await import('@server/db')
    const { SchemaVersionManager } = await import('@server/services/versionService')
    await SchemaVersionManager.ensureRecordTable()
    await applyMigration(db, '0001_initial_schema.up.sql')
    await applyMigration(db, '0002_project_settings.up.sql')
    await applyMigration(db, '0003_feedback.up.sql')
    await db.run(sql`INSERT INTO schema_versions (version, name, checksum, state) VALUES ('0001', 'initial_schema', '', 'applied')`)
    await db.run(sql`INSERT INTO schema_versions (version, name, checksum, state) VALUES ('0002', 'project_settings', '', 'applied')`)
    await db.run(sql`INSERT INTO schema_versions (version, name, checksum, state) VALUES ('0003', 'feedback', '', 'applied')`)
    await db.run(sql`INSERT INTO projects (id, name, version, framework, css_strategy, router_mode, created_at, updated_at) VALUES ('legacy', 'Legacy', '1.0.0', 'react', 'tailwind', 'file', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`)

    expect(await SchemaVersionManager.runPendingMigrations(resolve('src/server/db/migrations'))).toBe(5)
    const project = await db.get<{ name: string }>(sql`SELECT name FROM projects WHERE id = 'legacy'`)
    const tables = await db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'table'`)
    expect(project?.name).toBe('Legacy')
    expect(tables.map((table) => table.name)).toEqual(expect.arrayContaining(['accounts', 'sessions']))
  })
})
