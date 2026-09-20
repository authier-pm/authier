import { and, eq, isNull } from 'drizzle-orm'
import { createHash } from 'node:crypto'
import * as schema from '../drizzle/schema'
import type { DbType } from '../prisma/prismaClient'
import type {
  IContext,
  IContextAuthenticated
} from '../models/types/ContextTypes'
import { GraphqlError } from './GraphqlError'
import { getBackendOrigin } from '../utils/getBackendOrigin'
import { sendEmail } from '../utils/email'
import {
  masterDeviceResetConfigSchema,
  resetNotificationRecipients,
  type MasterDeviceResetConfig
} from '../../shared/masterDeviceResetConfig'

type Transaction = Parameters<Parameters<DbType['transaction']>[0]>[0]
export const hashResetToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

export const queueResetEmail = async (
  tx: Transaction,
  userId: string,
  email: string | null,
  config: MasterDeviceResetConfig,
  subject: string,
  message: string
) => {
  const recipients = resetNotificationRecipients(email, config)
  if (recipients.length)
    await tx
      .insert(schema.masterDeviceResetEmail)
      .values(
        recipients.map((recipient) => ({ userId, recipient, subject, message }))
      )
}

export const flushResetEmails = async (db: DbType) => {
  // Lock each row through delivery so overlapping cron invocations cannot send it twice.
  // Delivery is at-least-once if the process dies after Mailjet accepts the message.
  const pending = await db
    .select({ id: schema.masterDeviceResetEmail.id })
    .from(schema.masterDeviceResetEmail)
    .where(isNull(schema.masterDeviceResetEmail.sentAt))
    .limit(100)
  const failures: unknown[] = []
  for (const item of pending) {
    await db
      .transaction(async (tx) => {
        const [email] = await tx
          .select()
          .from(schema.masterDeviceResetEmail)
          .where(
            and(
              eq(schema.masterDeviceResetEmail.id, item.id),
              isNull(schema.masterDeviceResetEmail.sentAt)
            )
          )
          .for('update', { skipLocked: true })
        if (!email) return
        await sendEmail(email.recipient, {
          Subject: email.subject,
          TextPart: email.message
        })
        await tx
          .update(schema.masterDeviceResetEmail)
          .set({ sentAt: new Date() })
          .where(eq(schema.masterDeviceResetEmail.id, email.id))
      })
      .catch((error: unknown) => {
        failures.push(error)
      })
  }
  if (failures.length)
    throw new AggregateError(
      failures,
      'Some reset emails could not be delivered'
    )
}

export const initiateReset = async (
  ctx: IContext,
  email: string,
  deviceId: string,
  challengeId: number
) =>
  ctx.db.transaction(async (tx) => {
    const [user] = await tx
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .for('update')
    if (!user?.masterDeviceId || !user.email)
      throw new GraphqlError('No master device to reset')
    const challenge = await tx.query.decryptionChallenge.findFirst({
      where: { id: challengeId, userId: user.id, deviceId }
    })
    if (!challenge || challenge.rejectedAt || challenge.blockIp)
      throw new GraphqlError('login failed')
    const now = new Date()
    const existing = await tx
      .select()
      .from(schema.masterDeviceResetRequest)
      .where(
        and(
          eq(schema.masterDeviceResetRequest.userId, user.id),
          isNull(schema.masterDeviceResetRequest.completedAt),
          isNull(schema.masterDeviceResetRequest.rejectedAt)
        )
      )
    const active = existing.find(
      (request) =>
        request.targetMasterDeviceId === user.masterDeviceId &&
        (request.confirmedAt || request.expiresAt > now)
    )
    if (active)
      return {
        requestedAt: active.createdAt,
        processAt: active.processAt,
        alreadyPending: true
      }
    // Expired, unconfirmed requests must not block recovery forever.
    for (const request of existing)
      await tx
        .delete(schema.masterDeviceResetRequest)
        .where(eq(schema.masterDeviceResetRequest.id, request.id))
    const config = masterDeviceResetConfigSchema.parse(
      user.masterDeviceResetConfig
    )
    const devices = await tx
      .select()
      .from(schema.device)
      .where(
        and(eq(schema.device.userId, user.id), isNull(schema.device.logoutAt))
      )
    const eligibleDeviceIds = devices
      .filter(
        (device) => device.id !== user.masterDeviceId && device.id !== deviceId
      )
      .map((device) => device.id)
    const processAt = new Date(now.getTime() + config.waitMinutes * 60_000)
    const token = crypto.randomUUID()
    const values = {
      config,
      eligibleDeviceIds,
      approvedDeviceIds: [],
      createdAt: now,
      processAt,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60_000),
      confirmedAt: null,
      completedAt: null,
      rejectedAt: null,
      confirmationTokenHash: hashResetToken(token),
      targetMasterDeviceId: user.masterDeviceId
    }
    await tx
      .insert(schema.masterDeviceResetRequest)
      .values({
        ...values,
        userId: user.id,
        decryptionChallengeId: challengeId
      })
      .onConflictDoUpdate({
        target: schema.masterDeviceResetRequest.decryptionChallengeId,
        set: values
      })
    const message = `A master device reset was requested for ${user.email}. It requires ${config.requiredApprovals} other device approval(s) and a ${config.waitMinutes}-minute wait after email confirmation. The vault password is still required. Reject this request in Devices if it was not you.`
    await queueResetEmail(
      tx,
      user.id,
      user.email,
      config,
      'Master device reset requested',
      message
    )
    // Keep the token out of persistent storage. A send failure rolls back the request so it can be retried.
    await sendEmail(user.email, {
      Subject: 'Confirm master device reset',
      TextPart: `${message}\nConfirm within 24 hours: ${getBackendOrigin()}/confirm-master-device-reset?token=${token}`,
      HTMLPart: `<p>Confirm your master device reset within 24 hours. Your configured waiting period and device approvals are required.</p><p><a href="${getBackendOrigin()}/confirm-master-device-reset?token=${token}">Confirm master device reset</a></p>`
    })
    return { requestedAt: now, processAt, alreadyPending: false }
  })

export const confirmReset = async (
  db: DbType,
  token: string,
  now = new Date()
) => {
  const [candidate] = await db
    .select()
    .from(schema.masterDeviceResetRequest)
    .where(
      eq(
        schema.masterDeviceResetRequest.confirmationTokenHash,
        hashResetToken(token)
      )
    )
  if (!candidate) return 'not-found'
  return db.transaction(async (tx) => {
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
    if (!request || !user) return 'not-found'
    if (request.completedAt) return 'already-completed'
    if (
      request.rejectedAt ||
      user.masterDeviceId !== request.targetMasterDeviceId
    )
      return 'rejected'
    if (request.confirmedAt) return 'confirmed'
    if (request.expiresAt <= now) return 'expired'
    const processAt = new Date(
      now.getTime() + request.config.waitMinutes * 60_000
    )
    await tx
      .update(schema.masterDeviceResetRequest)
      .set({ confirmedAt: now, processAt })
      .where(eq(schema.masterDeviceResetRequest.id, request.id))
    await queueResetEmail(
      tx,
      user.id,
      user.email,
      request.config,
      'Master device reset confirmed',
      `Email confirmed. Your master device reset can complete after ${processAt.toISOString()} once ${request.config.requiredApprovals} other device approval(s) are recorded. Reject it in Devices to cancel.`
    )
    return 'confirmed'
  })
}

// Returns null for a normal login challenge, allowing its existing approval policy to apply.
export const actOnReset = async (
  ctx: IContextAuthenticated,
  challengeId: number,
  action: 'approve' | 'reject'
) =>
  ctx.db.transaction(async (tx) => {
    const [user] = await tx
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, ctx.jwtPayload.userId))
      .for('update')
    const [request] = await tx
      .select()
      .from(schema.masterDeviceResetRequest)
      .where(
        and(
          eq(schema.masterDeviceResetRequest.userId, ctx.jwtPayload.userId),
          eq(
            schema.masterDeviceResetRequest.decryptionChallengeId,
            challengeId
          ),
          isNull(schema.masterDeviceResetRequest.completedAt),
          isNull(schema.masterDeviceResetRequest.rejectedAt)
        )
      )
      .for('update')
    if (!request) return null
    const device = await tx.query.device.findFirst({
      where: { id: ctx.device.id, userId: user.id }
    })
    if (
      !device ||
      device.logoutAt ||
      user.masterDeviceId !== request.targetMasterDeviceId
    )
      throw new GraphqlError('Device cannot act on this reset')
    const challenge = await tx.query.decryptionChallenge.findFirst({
      where: { id: challengeId, userId: user.id }
    })
    if (!challenge) throw new GraphqlError('Challenge not found')
    if (action === 'approve') {
      if (!request.eligibleDeviceIds.includes(device.id))
        throw new GraphqlError(
          'Approval requires another device registered before this reset'
        )
      if (request.approvedDeviceIds.includes(device.id)) return challenge
      const approvedDeviceIds = [...request.approvedDeviceIds, device.id]
      await tx
        .update(schema.masterDeviceResetRequest)
        .set({ approvedDeviceIds })
        .where(eq(schema.masterDeviceResetRequest.id, request.id))
      await queueResetEmail(
        tx,
        user.id,
        user.email,
        request.config,
        'Master device reset approval received',
        `Another device approved your reset (${approvedDeviceIds.length}/${request.config.requiredApprovals}). The waiting period and email confirmation are still required. Reject the request in Devices to cancel.`
      )
      return challenge
    }
    await tx
      .update(schema.masterDeviceResetRequest)
      .set({ rejectedAt: new Date() })
      .where(eq(schema.masterDeviceResetRequest.id, request.id))
    const [rejected] = await tx
      .update(schema.decryptionChallenge)
      .set({ rejectedAt: new Date(), approvedAt: null, blockIp: true })
      .where(eq(schema.decryptionChallenge.id, challengeId))
      .returning()
    await queueResetEmail(
      tx,
      user.id,
      user.email,
      request.config,
      'Master device reset cancelled',
      'A signed-in device rejected your master device reset. The master device was not removed.'
    )
    return rejected
  })

export const updateResetConfig = async (
  ctx: IContextAuthenticated,
  input: MasterDeviceResetConfig
) => {
  const config = masterDeviceResetConfigSchema.parse(input)
  return ctx.db.transaction(async (tx) => {
    const [user] = await tx
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, ctx.jwtPayload.userId))
      .for('update')
    if (user?.masterDeviceId !== ctx.device.id)
      throw new GraphqlError(
        'Recovery settings can be changed only from the master device'
      )
    const [updated] = await tx
      .update(schema.user)
      .set({
        masterDeviceResetConfig: config,
        deviceRecoveryCooldownMinutes: config.waitMinutes
      })
      .where(eq(schema.user.id, user.id))
      .returning()
    return updated!
  })
}

export const getResetStatus = async (db: DbType, challengeId: number) => {
  const [request] = await db
    .select()
    .from(schema.masterDeviceResetRequest)
    .where(
      eq(schema.masterDeviceResetRequest.decryptionChallengeId, challengeId)
    )
  if (!request) return null
  const devices = await db
    .select({ id: schema.device.id })
    .from(schema.device)
    .where(
      and(
        eq(schema.device.userId, request.userId),
        isNull(schema.device.logoutAt)
      )
    )
  const approvalCount = new Set(
    request.approvedDeviceIds.filter(
      (id) =>
        request.eligibleDeviceIds.includes(id) &&
        devices.some((device) => device.id === id)
    )
  ).size
  return {
    requiredApprovals: request.config.requiredApprovals,
    approvalCount,
    requestedAt: request.createdAt,
    processAt: request.processAt,
    expiresAt: request.expiresAt,
    confirmedAt: request.confirmedAt,
    completedAt: request.completedAt,
    rejectedAt: request.rejectedAt
  }
}
