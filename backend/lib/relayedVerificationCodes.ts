import { ORPCError } from '@orpc/server'
import { and, count, desc, eq, gt, lte, ne } from 'drizzle-orm'
import {
  MAX_ACTIVE_RELAYED_CODES,
  RELAYED_CODE_LIFETIME_MS
} from '../../shared/relayedVerificationCode'
import type { VaultApiInputs } from '../../shared/orpc/contract'
import { device, relayedVerificationCode } from '../drizzle/schema'
import { createRequestDb, type DbType } from '../prisma/prismaClient'
import type { IContextAuthenticated } from '../models/types/ContextTypes'

/** Codes are useless after expiry; never keep their ciphertext around. */
export const deleteExpiredRelayedCodes = async (db: DbType, now = new Date()) =>
  (
    await db
      .delete(relayedVerificationCode)
      .where(lte(relayedVerificationCode.expiresAt, now))
      .returning({ id: relayedVerificationCode.id })
  ).length

/** Runs from the worker cron, so expired codes are removed even without new relays. */
export const purgeExpiredRelayedCodes = async (now = new Date()) => {
  const requestDb = createRequestDb()
  try {
    return await deleteExpiredRelayedCodes(requestDb.db, now)
  } finally {
    await requestDb.close()
  }
}

/** Stores a phone's encrypted code for the account's browsers to pick up. */
export const relayVerificationCode = async (
  ctx: IContextAuthenticated,
  input: VaultApiInputs['verificationCodes']['relay']
) => {
  const { userId, deviceId } = ctx.jwtPayload
  const now = new Date()
  await deleteExpiredRelayedCodes(ctx.db, now)
  const [{ active }] = await ctx.db
    .select({ active: count() })
    .from(relayedVerificationCode)
    .where(
      and(
        eq(relayedVerificationCode.userId, userId),
        // A retry of an accepted upload must not count against its own limit.
        ne(relayedVerificationCode.id, input.id)
      )
    )
  if (active >= MAX_ACTIVE_RELAYED_CODES) {
    throw new ORPCError('TOO_MANY_REQUESTS', {
      message: 'Too many verification codes are waiting. Try again later.'
    })
  }
  await ctx.db
    .insert(relayedVerificationCode)
    .values({
      userId,
      id: input.id,
      deviceId,
      encrypted: input.encrypted,
      createdAt: now,
      expiresAt: new Date(now.getTime() + RELAYED_CODE_LIFETIME_MS)
    })
    .onConflictDoNothing()
  return { ok: true as const }
}

export const listRelayedVerificationCodes = (db: DbType, userId: string) =>
  db
    .select({
      id: relayedVerificationCode.id,
      encrypted: relayedVerificationCode.encrypted,
      createdAt: relayedVerificationCode.createdAt,
      expiresAt: relayedVerificationCode.expiresAt,
      deviceName: device.name
    })
    .from(relayedVerificationCode)
    .innerJoin(device, eq(device.id, relayedVerificationCode.deviceId))
    .where(
      and(
        eq(relayedVerificationCode.userId, userId),
        gt(relayedVerificationCode.expiresAt, new Date())
      )
    )
    .orderBy(desc(relayedVerificationCode.createdAt))
