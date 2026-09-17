import { SchemaVersionManager } from '../services/versionService'
import { join } from 'path'
import { fileURLToPath } from 'url'

const migrationsFolder = join(fileURLToPath(new URL('.', import.meta.url)), '../../db/migrations')

async function main() {
  const status = await SchemaVersionManager.status(migrationsFolder)
  const applied = await SchemaVersionManager.runPendingMigrations(migrationsFolder)
  console.log(`Applied ${applied} migrations`)
  if (status.current) console.log(`Current version: ${status.current}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
