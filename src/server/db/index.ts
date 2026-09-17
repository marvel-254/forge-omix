import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { SchemaVersionManager } from '../services/versionService'

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./data/forge.db',
})

export const db = drizzle(client)

const migrationsFolder = join(fileURLToPath(new URL('.', import.meta.url)), 'migrations')

export async function runMigrations() {
  try {
    await SchemaVersionManager.runPendingMigrations(migrationsFolder)
    console.log('✅ Migrations applied')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}
