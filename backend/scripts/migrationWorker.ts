import { sql } from 'drizzle-orm'
import {
  createRequestDb,
  withDatabase,
  type DatabaseBindings
} from '../prisma/prismaClient'
import {
  applyDatabaseMigrations,
  validMigrations
} from '../lib/databaseMigrations'
import type { MigrationMeta } from 'drizzle-orm/migrator'

export default {
  async fetch(
    request: Request,
    env: DatabaseBindings & { MIGRATION_TOKEN?: string }
  ) {
    if (
      !env.MIGRATION_TOKEN ||
      request.headers.get('Authorization') !== `Bearer ${env.MIGRATION_TOKEN}`
    )
      return new Response('Unauthorized', { status: 401 })
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }
    const path = new URL(request.url).pathname
    if (path !== '/check' && path !== '/migrate') {
      return new Response('Not found', { status: 404 })
    }
    let migrations: MigrationMeta[] = []
    if (path === '/migrate') {
      const body = await request.text()
      if (new TextEncoder().encode(body).length > 1024 * 1024) {
        return new Response('Migration payload too large', { status: 413 })
      }
      let value: unknown
      try {
        value = JSON.parse(body)
      } catch {
        return new Response('Invalid JSON', { status: 400 })
      }
      if (!validMigrations(value)) {
        return new Response('Invalid migration journal', { status: 400 })
      }
      migrations = value
    }
    return withDatabase(env, async () => {
      const { db } = createRequestDb()
      const [target] = await db.execute<{ database: string; user: string }>(
        sql`SELECT current_database() AS database, current_user AS "user"`
      )
      if (target?.database !== 'authier' || target.user !== 'authier_app') {
        return new Response('Unexpected migration target', { status: 409 })
      }
      const applied =
        path === '/migrate' ? await applyDatabaseMigrations(db, migrations) : 0
      return Response.json({ ok: true, ...target, applied })
    })
  }
}
