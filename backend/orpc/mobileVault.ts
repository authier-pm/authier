import { ORPCError } from '@orpc/server'
import { and, asc, eq, gt } from 'drizzle-orm'
import { createHash } from 'node:crypto'
import type { VaultApiInputs } from '@shared/orpc/contract'
import type { MobileSecretRecord } from '@shared/orpc/schemas'
import { mobileSecretRecordSchema } from '@shared/orpc/schemas'
import * as schema from '../drizzle/schema'
import type { IContextAuthenticated } from '../models/types/ContextTypes'
import {
  runVaultTransaction,
  type VaultTransaction,
  type VaultWriter
} from '../vault/vaultWrites'

type WriteKind = 'create' | 'update' | 'delete'
type WriteInput = VaultApiInputs['mobile'][WriteKind]

type Secret = typeof schema.encryptedSecret.$inferSelect
export const toMobileSecret = (secret: Secret): MobileSecretRecord => ({
  id: secret.id,
  encrypted: secret.encrypted,
  kind: secret.kind,
  version: secret.version,
  createdAt: secret.createdAt.toISOString(),
  updatedAt: secret.updatedAt?.toISOString() ?? null,
  deletedAt: secret.deletedAt?.toISOString() ?? null
})

const encodeCursor = (ctx: IContextAuthenticated, revision: bigint) =>
  `v1:${ctx.jwtPayload.userId}:${ctx.device.syncTOTP ? 'all' : 'passwords'}:${revision}`

const invalidCursor = (): never => {
  throw new ORPCError('CURSOR_INVALID', {
    status: 400,
    message:
      'The sync cursor is invalid for this account or device policy; restart synchronization without a cursor.'
  })
}

const decodeCursor = (
  ctx: IContextAuthenticated,
  cursor: string | undefined
) => {
  if (!cursor || cursor === '0') return 0n
  const prefix = encodeCursor(ctx, 0n).slice(0, -1)
  if (!cursor.startsWith(prefix)) return invalidCursor()
  const revision = cursor.slice(prefix.length)
  if (!/^(0|[1-9][0-9]{0,18})$/.test(revision)) return invalidCursor()
  const value = BigInt(revision)
  if (value > 9223372036854775807n) return invalidCursor()
  return value
}

export const syncVault = async (
  ctx: IContextAuthenticated,
  input: VaultApiInputs['mobile']['sync']
) => {
  const revision = decodeCursor(ctx, input.cursor)
  const [account] = await ctx.db
    .select({ revision: schema.user.vaultRevision })
    .from(schema.user)
    .where(eq(schema.user.id, ctx.jwtPayload.userId))
  if (!account || revision > account.revision) return invalidCursor()
  const limit = input.limit ?? 100
  const rows = await ctx.db
    .select()
    .from(schema.vaultChange)
    .where(
      and(
        eq(schema.vaultChange.userId, ctx.jwtPayload.userId),
        gt(schema.vaultChange.revision, revision)
      )
    )
    .orderBy(asc(schema.vaultChange.revision))
    .limit(limit + 1)
  const page = rows.slice(0, limit)
  return {
    changes: page.map((row) => {
      const secret = toMobileSecret({ ...row, id: row.secretId })
      if (!ctx.device.syncTOTP && row.kind === 'TOTP') {
        secret.encrypted = ''
        secret.deletedAt ??= secret.updatedAt ?? secret.createdAt
      }
      return { cursor: encodeCursor(ctx, row.revision), secret }
    }),
    nextCursor: encodeCursor(ctx, page.at(-1)?.revision ?? revision),
    hasMore: rows.length > limit
  }
}

const applyWrite = async (
  writer: VaultWriter,
  tx: VaultTransaction,
  userId: string,
  kind: WriteKind,
  input: WriteInput
) => {
  if (kind === 'create' && 'encrypted' in input) {
    const [created] = await writer.create([
      { id: input.id, encrypted: input.encrypted, kind: input.kind }
    ])
    return toMobileSecret(created)
  }
  if (!('expectedVersion' in input))
    throw new Error('Expected version is required')
  const patch =
    kind === 'delete'
      ? { deletedAt: new Date() }
      : {
          encrypted: 'encrypted' in input ? input.encrypted : undefined,
          kind: 'kind' in input ? input.kind : undefined
        }
  const [updated] = await writer.update([input.id], patch, {
    expectedVersion: input.expectedVersion
  })
  if (!updated) {
    const [current] = await tx
      .select()
      .from(schema.encryptedSecret)
      .where(
        and(
          eq(schema.encryptedSecret.id, input.id),
          eq(schema.encryptedSecret.userId, userId)
        )
      )
    if (!current)
      throw new ORPCError('NOT_FOUND', { message: 'Secret not found' })
    throw new ORPCError('CONFLICT', {
      message: 'Secret changed on another device; synchronize before retrying',
      data: { currentVersion: current.version }
    })
  }
  return toMobileSecret(updated)
}

export const writeVaultSecret = async (
  ctx: IContextAuthenticated,
  kind: WriteKind,
  input: WriteInput
) => {
  const userId = ctx.jwtPayload.userId
  const canonicalInput = Object.fromEntries(
    Object.entries(input).sort(([a], [b]) => a.localeCompare(b))
  )
  const requestHash = createHash('sha256')
    .update(JSON.stringify({ kind, input: canonicalInput }))
    .digest('hex')
  return runVaultTransaction(ctx.db, ctx.jwtPayload, async (writer, tx) => {
    // The unique operation key serializes concurrent retries. A failed write
    // rolls this reservation back, so failures never consume an operation id.
    const [reservation] = await tx
      .insert(schema.vaultOperation)
      .values({ userId, operationId: input.operationId, requestHash })
      .onConflictDoNothing()
      .returning()
    if (!reservation) {
      const [previous] = await tx
        .select()
        .from(schema.vaultOperation)
        .where(
          and(
            eq(schema.vaultOperation.userId, userId),
            eq(schema.vaultOperation.operationId, input.operationId)
          )
        )
      if (previous.requestHash !== requestHash)
        throw new ORPCError('CONFLICT', {
          message: 'Operation id was already used with different input'
        })
      return mobileSecretRecordSchema.parse(previous.response)
    }
    const response = await applyWrite(writer, tx, userId, kind, input)
    await tx
      .update(schema.vaultOperation)
      .set({ response })
      .where(
        and(
          eq(schema.vaultOperation.userId, userId),
          eq(schema.vaultOperation.operationId, input.operationId)
        )
      )
    return response
  })
}
