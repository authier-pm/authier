import { eq } from 'drizzle-orm'
import * as schema from '../drizzle/schema'
import type { AddNewDeviceInput } from '../models/AuthInputs'
import type { IContext } from '../models/types/ContextTypes'
import { hashDeviceSecret, verifyDeviceSecret } from '../utils/deviceSecretHash'
import { GraphqlErrorUnauthorized } from './GraphqlError'

export const resumeDeviceSession = async (
  ctx: IContext,
  params: {
    email: string
    deviceId: string
    currentAddDeviceSecret: string
    input: AddNewDeviceInput
  }
) => {
  const ipAddress = ctx.getIpAddress()

  return ctx.db.transaction(async (tx) => {
    const [foundUser] = await tx
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, params.email))
      .for('update')

    if (!foundUser) {
      throw new GraphqlErrorUnauthorized(
        'This device needs approval before its session can resume'
      )
    }

    const isBlocked = await tx.query.decryptionChallenge.findFirst({
      where: {
        userId: foundUser.id,
        blockIp: true,
        ipAddress
      }
    })
    if (isBlocked) {
      throw new GraphqlErrorUnauthorized('Login failed, try again later.')
    }

    const [deviceRec] = await tx
      .select()
      .from(schema.device)
      .where(eq(schema.device.id, params.deviceId))
      .for('update')

    if (
      !deviceRec ||
      deviceRec.userId !== foundUser.id ||
      deviceRec.logoutAt ||
      deviceRec.deletedAt
    ) {
      throw new GraphqlErrorUnauthorized(
        'This device needs approval before its session can resume'
      )
    }

    if (
      !(await verifyDeviceSecret(
        params.currentAddDeviceSecret,
        foundUser.addDeviceSecret
      ))
    ) {
      throw new GraphqlErrorUnauthorized(
        'This device needs approval before its session can resume'
      )
    }

    const [updatedUser] = await tx
      .update(schema.user)
      .set({
        addDeviceSecret: await hashDeviceSecret(params.input.addDeviceSecret),
        addDeviceSecretEncrypted: params.input.addDeviceSecretEncrypted
      })
      .where(eq(schema.user.id, foundUser.id))
      .returning()

    const [updatedDevice] = await tx
      .update(schema.device)
      .set({
        lastIpAddress: ipAddress,
        firebaseToken: params.input.firebaseToken ?? deviceRec.firebaseToken
      })
      .where(eq(schema.device.id, deviceRec.id))
      .returning()

    return {
      user: updatedUser,
      device: updatedDevice
    }
  })
}
