import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { drizzle } from 'drizzle-orm/pglite'
import { dbSchema } from '../drizzle'
import { relations } from '../drizzle/relations'
import { user } from '../drizzle/schema'
import { db, setDb } from '../prisma/prismaClient'
import { runMigrationsForPGlite } from '../tests/runMigrationsForPGlite'
import { classifyAndCachePasswordForm } from '../lib/classifyPasswordForm'
import { passwordFormSnapshotSchema } from '../../shared/passwordFormClassification'

// A live-provider smoke check with an in-memory database and a sanitized fixture.
// Usage: bun scripts/verifyPasswordFormClassification.ts <snapshot.json>
const filename = process.argv[2]
if (!filename || !process.env.OPENROUTER_API_KEY) {
  throw new Error(
    'Provide a sanitized snapshot JSON file and OPENROUTER_API_KEY'
  )
}
const snapshot = passwordFormSnapshotSchema.parse(
  JSON.parse(await readFile(filename, 'utf8'))
)
const client = new PGlite({ extensions: { citext } })
setDb(drizzle({ client, schema: dbSchema, relations }))
await runMigrationsForPGlite(
  client,
  fileURLToPath(new URL('../drizzle/migrations', import.meta.url))
)
const userId = crypto.randomUUID()
await db.insert(user).values({
  id: userId,
  email: 'classifier-smoke@example.com',
  addDeviceSecret: 'test',
  addDeviceSecretEncrypted: 'test',
  encryptionSalt: 'test',
  loginCredentialsLimit: 50,
  TOTPlimit: 4,
  deviceRecoveryCooldownMinutes: 960
})
const first = await classifyAndCachePasswordForm(db, userId, snapshot)
if (!first) throw new Error('Live provider returned no classification')
// A second lookup must succeed even without credentials for the provider.
delete process.env.OPENROUTER_API_KEY
const cached = await classifyAndCachePasswordForm(db, userId, snapshot)
if (cached?.id !== first.id)
  throw new Error('Classification cache was not reused')
console.log(
  JSON.stringify(
    {
      model: 'openrouter/free',
      result: first.formClassification?.result,
      cached: true
    },
    null,
    2
  )
)
await client.close()
