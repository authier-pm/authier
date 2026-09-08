import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { drizzle } from 'drizzle-orm/pglite'
import { fileURLToPath } from 'node:url'
import { buildApp } from '../app'
import { dbSchema } from '../drizzle'
import { relations } from '../drizzle/relations'
import { setDb } from '../prisma/prismaClient'
import { runMigrationsForPGlite } from '../tests/runMigrationsForPGlite'

if (process.env.NODE_ENV !== 'test')
  throw new Error('Smoke server requires NODE_ENV=test')
process.env.ACCESS_TOKEN_SECRET = 'local-smoke-access-secret'
process.env.REFRESH_TOKEN_SECRET = 'local-smoke-refresh-secret'
process.env.FRONTEND_URL = 'http://127.0.0.1:5173'
const client = new PGlite({ extensions: { citext } })
await runMigrationsForPGlite(
  client,
  fileURLToPath(new URL('../drizzle/migrations', import.meta.url))
)
setDb(drizzle({ client, schema: dbSchema, relations }))
const app = buildApp()
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 5052,
  fetch: (request) => {
    const headers = new Headers(request.headers)
    headers.set('x-forwarded-for', '127.0.0.1')
    return app.handle(new Request(request, { headers }))
  }
})
console.log(`Local PGlite smoke API: ${server.url}api/v1 (ephemeral data)`)
const shutdown = async () => {
  await server.stop()
  await client.close()
  process.exit(0)
}
process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
