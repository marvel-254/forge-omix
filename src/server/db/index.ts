import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { SchemaVersionManager } from '../services/versionService'

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./data/forge.db',
})

export const db = drizzle(client)

/**
 * Migrations live next to this module at runtime (including inside the
 * production bundle). Under test runners where import.meta.url is not a
 * file: URL, fall back to the repo-relative path.
 */
function defaultMigrationsFolder(): string {
  try {
    return join(fileURLToPath(new URL('.', import.meta.url)), 'migrations')
  } catch {
    return resolve('src/server/db/migrations')
  }
}

const migrationsFolder = defaultMigrationsFolder()

export async function runMigrations() {
  try {
    await SchemaVersionManager.runPendingMigrations(migrationsFolder)
    console.log('✅ Migrations applied')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}
