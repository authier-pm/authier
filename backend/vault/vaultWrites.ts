import { ORPCError } from '@orpc/server'
import { and, count, eq, inArray, isNull, sql } from 'drizzle-orm'
import * as schema from '../drizzle/schema'
import type { IContext, IJWTPayload } from '../models/types/ContextTypes'

export type VaultTransaction = Parameters<
  Parameters<IContext['db']['transaction']>[0]
>[0]
type Secret = typeof schema.encryptedSecret.$inferSelect
type NewSecret = Pick<Secret, 'id' | 'kind' | 'encrypted'>
type SecretPatch = Partial<Pick<Secret, 'kind' | 'encrypted' | 'deletedAt'>>

const createVaultWriter = (tx: VaultTransaction, userId: string) => {
  const recordChanges = async (records: Secret[]) => {
    if (records.length === 0) return
    const [account] = await tx
      .update(schema.user)
      .set({
        vaultRevision: sql`${schema.user.vaultRevision} + ${records.length}`
      })
      .where(eq(schema.user.id, userId))
      .returning({ revision: schema.user.vaultRevision })
    const firstRevision = account.revision - BigInt(records.length) + 1n
    await tx.insert(schema.vaultChange).values(
      records.map((record, index) => ({
        ...record,
        secretId: record.id,
        revision: firstRevision + BigInt(index)
      }))
    )
  }

  const checkLimits = async () => {
    const [account] = await tx
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
    const counts = await tx
      .select({ kind: schema.encryptedSecret.kind, count: count() })
      .from(schema.encryptedSecret)
      .where(
        and(
          eq(schema.encryptedSecret.userId, userId),
          isNull(schema.encryptedSecret.deletedAt)
        )
      )
      .groupBy(schema.encryptedSecret.kind)
    // Passwords and passkeys share the credential quota. Count them together so
    // changing kinds or creating a mixture cannot bypass the account limit.
    const credentials = counts
      .filter(({ kind }) => kind !== 'TOTP')
      .reduce((total, entry) => total + entry.count, 0)
    const totps = counts.find(({ kind }) => kind === 'TOTP')?.count ?? 0
    if (credentials > account.loginCredentialsLimit)
      throw new ORPCError('BAD_REQUEST', {
        message: 'Credential account limit exceeded'
      })
    if (totps > account.TOTPlimit)
      throw new ORPCError('BAD_REQUEST', {
        message: 'TOTP account limit exceeded'
      })
  }

  const create = async (inputs: NewSecret[]) => {
    if (inputs.length === 0) return []
    const records = await tx
      .insert(schema.encryptedSecret)
      .values(inputs.map((input) => ({ ...input, userId, version: 1 })))
      .onConflictDoNothing()
      .returning()
    if (records.length !== inputs.length)
      throw new ORPCError('CONFLICT', { message: 'Secret id already exists' })
    await checkLimits()
    await recordChanges(records)
    return records
  }

  const update = async (
    ids: string[],
    patch: SecretPatch,
    options: { expectedVersion?: number } = {}
  ) => {
    if (ids.length === 0) return []
    const records = await tx
      .update(schema.encryptedSecret)
      .set({
        ...patch,
        version: sql`${schema.encryptedSecret.version} + 1`,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(schema.encryptedSecret.userId, userId),
          inArray(schema.encryptedSecret.id, ids),
          options.expectedVersion === undefined
            ? undefined
            : eq(schema.encryptedSecret.version, options.expectedVersion),
          isNull(schema.encryptedSecret.deletedAt)
        )
      )
      .returning()
    if (patch.kind !== undefined) await checkLimits()
    await recordChanges(records)
    return records
  }

  return { create, update }
}

export type VaultWriter = ReturnType<typeof createVaultWriter>

// All application writers (including GraphQL) enter here before locking or
// changing vault rows. The account lock is held through commit, so a later
// committed revision cannot overtake an uncommitted revision. The database has
// ordinary tables and constraints only; business logic stays in this service.
export const runVaultTransaction = <T>(
  db: IContext['db'],
  actor: string | IJWTPayload,
  action: (writer: VaultWriter, tx: VaultTransaction) => Promise<T>
) =>
  db.transaction(async (tx) => {
    const userId = typeof actor === 'string' ? actor : actor.userId
    const [account] = await tx
      .select({ id: schema.user.id, tokenVersion: schema.user.tokenVersion })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .for('update')
    if (!account)
      throw new ORPCError('UNAUTHORIZED', { message: 'Account not found' })
    // Transport auth can happen before this request waits for a password
    // rotation. Revalidate its generation only after acquiring the account lock.
    // String owners are reserved for trusted maintenance/test fixture callers.
    if (typeof actor !== 'string') {
      const [device] = await tx
        .select()
        .from(schema.device)
        .where(eq(schema.device.id, actor.deviceId))
        .for('share')
      if (
        account.tokenVersion !== actor.tokenVersion ||
        !device ||
        device.userId !== userId ||
        device.logoutAt ||
        device.deletedAt
      ) {
        throw new ORPCError('UNAUTHORIZED', {
          message:
            'Session changed; authenticate again before writing to the vault'
        })
      }
    }
    return action(createVaultWriter(tx, userId), tx)
  })
