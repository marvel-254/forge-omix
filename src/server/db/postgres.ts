import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool, type PoolConfig } from 'pg'
import * as schema from './schema.postgres'

export type PostgresDatabase = NodePgDatabase<typeof schema>

export interface PostgresConnection {
  db: PostgresDatabase
  pool: Pool
}

/**
 * Create the PostgreSQL runtime used by the Node API and migration tooling.
 * This is intentionally separate from `index.ts`: the existing app and tests
 * continue using LibSQL until their schema and query call sites are switched
 * together. Cloudflare Workers should create a request-scoped `pg.Client`
 * from `env.HYPERDRIVE.connectionString` instead of using this Pool factory.
 */
export function createPostgresConnection(
  connectionString: string,
  config: Omit<PoolConfig, 'connectionString'> = {}
): PostgresConnection {
  if (!connectionString.trim()) {
    throw new Error('A PostgreSQL connection string is required')
  }

  const pool = new Pool({
    connectionString,
    max: config.max ?? 10,
    idleTimeoutMillis: config.idleTimeoutMillis ?? 30_000,
    connectionTimeoutMillis: config.connectionTimeoutMillis ?? 10_000,
    ...config,
  })

  return { pool, db: drizzle(pool, { schema }) }
}
