import { and, eq, isNotNull, isNull, lte } from 'drizzle-orm'
import { createRequestDb, type DbType } from '../prisma/prismaClient'
import * as schema from '../drizzle/schema'
import { flushResetEmails, queueResetEmail } from './masterDeviceReset'

export const processDueResets = async (db: DbType, now = new Date()) => {
  const pending = await db
    .select()
    .from(schema.masterDeviceResetRequest)
    .where(
      and(
        isNull(schema.masterDeviceResetRequest.completedAt),
        isNull(schema.masterDeviceResetRequest.rejectedAt),
        isNotNull(schema.masterDeviceResetRequest.confirmedAt),
        lte(schema.masterDeviceResetRequest.processAt, now)
      )
    )
  let completedCount = 0
  for (const candidate of pending) {
    const completed = await db.transaction(async (tx) => {
      // Same lock order as confirmation, approvals and cancellation.
      const [user] = await tx
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, candidate.userId))
        .for('update')
      const [request] = await tx
        .select()
        .from(schema.masterDeviceResetRequest)
        .where(eq(schema.masterDeviceResetRequest.id, candidate.id))
        .for('update')
      if (
        !user ||
        !request ||
        request.completedAt ||
        request.rejectedAt ||
        !request.confirmedAt ||
        request.processAt > now
      )
        return false
      if (user.masterDeviceId !== request.targetMasterDeviceId) return false
      const challenge = await tx.query.decryptionChallenge.findFirst({
        where: { id: request.decryptionChallengeId }
      })
      if (!challenge || challenge.rejectedAt || challenge.blockIp) return false
      const devices = await tx
        .select()
        .from(schema.device)
        .where(
          and(eq(schema.device.userId, user.id), isNull(schema.device.logoutAt))
        )
      const approvalCount = new Set(
        request.approvedDeviceIds.filter(
          (id) =>
            request.eligibleDeviceIds.includes(id) &&
            id !== request.targetMasterDeviceId &&
            id !== challenge.deviceId &&
            devices.some((device) => device.id === id)
        )
      ).size
      if (approvalCount < request.config.requiredApprovals) return false
      await tx
        .update(schema.user)
        .set({ masterDeviceId: null })
        .where(eq(schema.user.id, user.id))
      await tx
        .delete(schema.device)
        .where(
          and(
            eq(schema.device.id, request.targetMasterDeviceId),
            eq(schema.device.userId, user.id)
          )
        )
      await tx
        .update(schema.masterDeviceResetRequest)
        .set({ completedAt: now })
        .where(eq(schema.masterDeviceResetRequest.id, request.id))
      await queueResetEmail(
        tx,
        user.id,
        user.email,
        request.config,
        'Master device reset completed',
        'Your previous master device has been removed. Log in with your existing vault password on a new device to make it your master device. Your encrypted secrets are unchanged.'
      )
      return true
    })
    if (completed) completedCount++
  }
  await flushResetEmails(db)
  return { dueCount: pending.length, completedCount }
}

export const processPendingMasterDeviceResets = async (now = new Date()) => {
  const requestDb = createRequestDb()
  try {
    return await processDueResets(requestDb.db, now)
  } finally {
    await requestDb.close()
  }
}
