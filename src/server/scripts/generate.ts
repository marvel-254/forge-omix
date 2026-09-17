import { SchemaVersionManager } from '../services/versionService'
import { join } from 'path'
import { fileURLToPath } from 'url'

const migrationsFolder = join(fileURLToPath(new URL('.', import.meta.url)), '../../db/migrations')

async function main() {
  const status = await SchemaVersionManager.status(migrationsFolder)
  console.log('Migrations:')
  for (const m of [...status.applied, ...status.pending, ...status.failed]) {
    console.log(`  [${m.state}] ${m.version} - ${m.name}`)
  }
  console.log(`Current: ${status.current ?? 'none'}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
