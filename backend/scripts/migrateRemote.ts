import { randomBytes } from 'node:crypto'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { unstable_dev } from 'wrangler'

export const migrateRemote = async (checkOnly = false) => {
  const token = randomBytes(32).toString('hex')
  const worker = await unstable_dev('scripts/migrationWorker.ts', {
    config: 'wrangler.migrations.toml',
    local: false,
    logLevel: 'error',
    ip: '127.0.0.1',
    port: 0,
    envFiles: [],
    vars: { MIGRATION_TOKEN: token },
    experimental: {
      watch: false,
      disableExperimentalWarning: true,
      disableDevRegistry: true
    }
  })
  try {
    const response = await worker.fetch(checkOnly ? '/check' : '/migrate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: checkOnly
        ? '{}'
        : JSON.stringify(
            readMigrationFiles({
              migrationsFolder: './drizzle/migrations'
            })
          ),
      signal: AbortSignal.timeout(120_000)
    })
    if (!response.ok) {
      throw new Error(`Private database operation failed (${response.status})`)
    }
    console.log('Private PostgreSQL through Hyperdrive:', await response.json())
  } finally {
    await worker.stop()
  }
}
