import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { setupValidatedRoutes } from './routes/validated'
import apiRouter from './routes'
import { runMigrations } from './db'

const app = new Hono<{ Variables: { validated?: unknown } }>()

app.use('*', logger())
app.use('*', cors())

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// New-style routes under /api (projects/pages/components/auth)
app.route('/api', apiRouter)

// Validated schema routes (legacy surface, also under /api)
setupValidatedRoutes(app)

if (process.env.NODE_ENV !== 'test') {
  runMigrations().catch((err) => {
    console.error('Initial migration failed:', err)
    process.exit(1)
  })
}

const port = Number(process.env.PORT) || 3001

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🚀 Server running on http://localhost:${info.port}`)
})

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
  })
}

export default app
