import { db } from '../db'
import { sql } from 'drizzle-orm'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'crypto'

export interface MigrationRecord {
  version: string
  name: string
  appliedAt: Date | null
  checksum: string | null
  state: 'applied' | 'pending' | 'failed'
}

export type MigrationState = MigrationRecord['state']

export interface MigrationStatus {
  current: string | null
  pending: MigrationRecord[]
  applied: MigrationRecord[]
  failed: MigrationRecord[]
}

export class SchemaVersionManager {
  static readonly CURRENT_VERSION = '1.0.0'

  static async recordTableExists(): Promise<boolean> {
    try {
      await db.get(sql`SELECT 1 FROM ${sql.identifier('schema_versions')} LIMIT 1`)
      return true
    } catch {
      return false
    }
  }

  static async ensureRecordTable() {
    await db.run(sql`CREATE TABLE IF NOT EXISTS schema_versions (version TEXT PRIMARY KEY, name TEXT NOT NULL, applied_at TIMESTAMP NOT NULL DEFAULT (datetime('now')), checksum TEXT, state TEXT NOT NULL DEFAULT 'applied')`)
  }

  /**
   * Current schema version = highest successfully-applied migration.
   * Rows in 'failed' state are ignored so a retry can proceed.
   */
  static async getVersion(): Promise<string> {
    await this.ensureRecordTable()
    const result = await db.all<{ version: string }>(
      sql`SELECT version FROM schema_versions WHERE state = 'applied' ORDER BY version DESC LIMIT 1`
    )
    return result[0]?.version || '0.0.0'
  }

  static async listMigrations(
    migrationsFolder: string
  ): Promise<{ version: string; name: string; up: string; down: string; checksum: string }[]> {
    let files: string[] = []
    try {
      files = await readdir(migrationsFolder)
    } catch {
      return []
    }

    const migrations = await Promise.all(
      files
        .filter((f) => f.endsWith('.up.sql'))
        .map(async (file) => {
          const version = file.slice(0, 4)
          const name = file.slice(5, -7)
          const upPath = join(migrationsFolder, file)
          const downPath = join(migrationsFolder, `${version}_${name}.down.sql`)
          const up = await readFile(upPath, 'utf-8')
          let down = ''
          try {
            down = await readFile(downPath, 'utf-8')
          } catch {
            down = ''
          }
          const checksum = createHash('sha256').update(up).digest('hex').slice(0, 12)
          return { version, name, up, down, checksum }
        })
    )

    return migrations.sort((a, b) => a.version.localeCompare(b.version))
  }

  static async status(migrationsFolder: string): Promise<MigrationStatus> {
    const migrations = await this.listMigrations(migrationsFolder)
    await this.ensureRecordTable()
    const records = await db.all<{ version: string; state: string }>(
      sql`SELECT version, state FROM schema_versions`
    )
    const recordMap = new Map(records.map((r) => [r.version, r.state]))

    const result: MigrationStatus = {
      current: await this.getVersion(),
      pending: [],
      applied: [],
      failed: [],
    }
    for (const m of migrations) {
      const state: MigrationState = (recordMap.get(m.version) as MigrationState) || 'pending'
      const record = {
        version: m.version,
        name: m.name,
        appliedAt: null,
        checksum: m.checksum,
        state,
      }
      if (state === 'pending') result.pending.push(record)
      else if (state === 'applied') result.applied.push(record)
      else result.failed.push(record)
    }
    return result
  }

  private static splitStatements(sql: string): string[] {
    return sql
      .split('\n')
      .reduce((acc: string[], line) => {
        if (line.trim().length > 0) {
          acc.push(line)
        }
        return acc
      }, [])
      .join('\n')
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  static async runPendingMigrations(migrationsFolder: string): Promise<number> {
    await this.ensureRecordTable()
    const migrations = await this.listMigrations(migrationsFolder)
    const current = await this.getVersion()
    // Compare numerically: file names sort as strings ("10_" < "9_" lexically)
    const toApply = migrations.filter(
      (m) => parseInt(m.version, 10) > parseInt(current, 10)
    )

    let applied = 0
    for (const migration of toApply) {
      const statements = this.splitStatements(migration.up)
      try {
        await db.run(sql`BEGIN IMMEDIATE`)
        for (const stmt of statements) {
          await db.run(sql.raw(stmt))
        }
        await db.run(
          sql`INSERT INTO schema_versions (version, name, checksum, state) VALUES (${migration.version}, ${migration.name}, ${migration.checksum}, 'applied')`
        )
        await db.run(sql`COMMIT`)
        applied++
      } catch (error) {
        await db.run(sql`ROLLBACK`)
        await db.run(
          sql`INSERT OR REPLACE INTO schema_versions (version, name, checksum, state) VALUES (${migration.version}, ${migration.name}, ${migration.checksum}, 'failed')`
        )
        throw error
      }
    }
    return applied
  }

  static async rollback(migrationsFolder: string, toVersion: string): Promise<number> {
    await this.ensureRecordTable()
    const migrations = await this.listMigrations(migrationsFolder)
    const toRollback = migrations
      .filter((m) => parseInt(m.version, 10) > parseInt(toVersion, 10) && m.down.length)
      .sort((a, b) => parseInt(b.version, 10) - parseInt(a.version, 10))

    let rolled = 0
    for (const migration of toRollback) {
      const statements = this.splitStatements(migration.down)
      try {
        await db.run(sql`BEGIN IMMEDIATE`)
        for (const stmt of statements) {
          await db.run(sql.raw(stmt))
        }
        await db.run(sql`DELETE FROM schema_versions WHERE version = ${migration.version}`)
        await db.run(sql`COMMIT`)
        rolled++
      } catch (error) {
        await db.run(sql`ROLLBACK`)
        throw error
      }
    }
    return rolled
  }

  static async migrateTo(migrationsFolder: string, version: string): Promise<{ migrated: boolean; applied: number }> {
    const current = await this.getVersion()
    if (current === version) return { migrated: false, applied: 0 }
    const applied = await this.runPendingMigrations(migrationsFolder)
    return { migrated: applied > 0, applied }
  }
}
