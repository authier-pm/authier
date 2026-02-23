import debug from 'debug'
import { and, eq, isNotNull, isNull, lte } from 'drizzle-orm'
import { createRequestDb } from '../prisma/prismaClient'
import * as schema from '../drizzle/schema'
import { sendEmail } from '../utils/email'

const log = debug('au:processPendingMasterDeviceResets')

type PendingResetRequest = {
  id: number
  userId: string
  targetMasterDeviceId: string
  processAt: Date
}

type ProcessResult = {
  completed: boolean
  userId: string
  sendCompletionEmailTo: string | null
  deletedDeviceName: string | null
}

const processSinglePendingReset = async (
  db: ReturnType<typeof createRequestDb>['db'],
  pendingResetRequest: PendingResetRequest,
  now: Date
): Promise<ProcessResult> => {
  let completed = false
  let sendCompletionEmailTo: string | null = null
  let deletedDeviceName: string | null = null

  await db.transaction(async (tx) => {
    const [resetRequest] = await tx
      .select({
        id: schema.masterDeviceResetRequest.id,
        userId: schema.masterDeviceResetRequest.userId,
        targetMasterDeviceId:
          schema.masterDeviceResetRequest.targetMasterDeviceId,
        processAt: schema.masterDeviceResetRequest.processAt,
        confirmedAt: schema.masterDeviceResetRequest.confirmedAt,
        completedAt: schema.masterDeviceResetRequest.completedAt,
        rejectedAt: schema.masterDeviceResetRequest.rejectedAt
      })
      .from(schema.masterDeviceResetRequest)
      .where(eq(schema.masterDeviceResetRequest.id, pendingResetRequest.id))
      .limit(1)

    if (!resetRequest) {
      return
    }

    if (
      resetRequest.completedAt ||
      resetRequest.rejectedAt ||
      !resetRequest.confirmedAt
    ) {
      return
    }

    if (resetRequest.processAt > now) {
      return
    }

    const user = await tx.query.user.findFirst({
      where: { id: resetRequest.userId },
      columns: {
        id: true,
        email: true,
        masterDeviceId: true
      }
    })

    if (!user) {
      await tx
        .delete(schema.masterDeviceResetRequest)
        .where(eq(schema.masterDeviceResetRequest.id, resetRequest.id))
      return
    }

    if (user.masterDeviceId !== resetRequest.targetMasterDeviceId) {
      await tx
        .delete(schema.masterDeviceResetRequest)
        .where(eq(schema.masterDeviceResetRequest.id, resetRequest.id))
      return
    }

    const deletedDevices = await tx
      .delete(schema.device)
      .where(
        and(
          eq(schema.device.id, resetRequest.targetMasterDeviceId),
          eq(schema.device.userId, user.id)
        )
      )
      .returning({
        name: schema.device.name
      })

    if (deletedDevices[0]?.name) {
      deletedDeviceName = deletedDevices[0].name
    }

    await tx
      .update(schema.user)
      .set({
        masterDeviceId: null
      })
      .where(eq(schema.user.id, user.id))

    await tx
      .update(schema.masterDeviceResetRequest)
      .set({
        completedAt: now
      })
      .where(
        and(
          eq(schema.masterDeviceResetRequest.id, resetRequest.id),
          isNull(schema.masterDeviceResetRequest.completedAt),
          isNull(schema.masterDeviceResetRequest.rejectedAt)
        )
      )

    completed = true
    sendCompletionEmailTo = user.email
  })

  return {
    completed,
    userId: pendingResetRequest.userId,
    sendCompletionEmailTo,
    deletedDeviceName
  }
}

export const processPendingMasterDeviceResets = async (now = new Date()) => {
  const requestDb = createRequestDb()

  try {
    const pendingResetRequests = await requestDb.db
      .select({
        id: schema.masterDeviceResetRequest.id,
        userId: schema.masterDeviceResetRequest.userId,
        targetMasterDeviceId:
          schema.masterDeviceResetRequest.targetMasterDeviceId,
        processAt: schema.masterDeviceResetRequest.processAt
      })
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

    for (const pendingResetRequest of pendingResetRequests) {
      const result = await processSinglePendingReset(
        requestDb.db,
        pendingResetRequest,
        now
      )

      if (!result.completed) {
        continue
      }

      completedCount += 1
      log('completed master device reset for user', result.userId)

      if (result.sendCompletionEmailTo) {
        await sendEmail(result.sendCompletionEmailTo, {
          Subject: 'Master device reset completed',
          TextPart: `Your master device reset has completed.
The previous master device has been removed${result.deletedDeviceName ? ` (${result.deletedDeviceName})` : ''}.
You can now log in from a new device and it will become your new master device after successful login.`,
          HTMLPart: `<p>Your master device reset has completed.</p><p>The previous master device has been removed${result.deletedDeviceName ? ` (<strong>${result.deletedDeviceName}</strong>)` : ''}.</p><p>You can now log in from a new device and it will become your new master device after successful login.</p>`
        })
      }
    }

    return {
      dueCount: pendingResetRequests.length,
      completedCount
    }
  } finally {
    await requestDb.close()
  }
}
