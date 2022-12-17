import { prismaClient } from '../prisma/prismaClient'
import { RegisterNewAccountInput } from '../models/AuthInputs'
import { makeRegisterAccountInput } from '../schemas/RootResolver.spec'
import { DecryptionChallengeApproved } from './DecryptionChallenge'
import { User } from '.prisma/client'
import faker from 'faker'
import { beforeAll, describe, expect, it } from 'vitest'
import { DeviceMutation } from './Device'

describe('Device', () => {
  let user: User

  const challenge: DecryptionChallengeApproved =
    new DecryptionChallengeApproved()

  challenge.id = faker.datatype.number()
  challenge.blockIp = false
  challenge.deviceId = faker.datatype.uuid()
  challenge.deviceName = faker.random.word()

  const userId = faker.datatype.uuid()
  const input: RegisterNewAccountInput = makeRegisterAccountInput()

  beforeAll(async () => {
    user = await prismaClient.user.create({
      data: {
        id: userId,
        email: input.email,
        addDeviceSecret: input.addDeviceSecret,
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
        encryptionSalt: input.encryptionSalt,
        loginCredentialsLimit: 50,
        TOTPlimit: 4,
        deviceRecoveryCooldownMinutes: 960
      }
    })
  })

  describe('logout', async () => {
    const deviceMutation = new DeviceMutation()

    //Device info
    deviceMutation.id = challenge.deviceId
    deviceMutation.userId = userId
    deviceMutation.name = challenge.deviceName

    it('slave device logout', async () => {
      // Create mock objects
      const fakeCtx = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        reply: { setCookie: () => {}, clearCookie: () => {} },
        request: { headers: {} },
        prisma: prismaClient,
        jwtPayload: { userId: userId },
        masterDeviceId: faker.datatype.uuid(),
        getIpAddress: () => faker.internet.ip()
      } as any

      await prismaClient.device.create({
        data: {
          id: deviceMutation.id,
          name: faker.random.word(),
          firebaseToken: faker.datatype.string(5),
          firstIpAddress: faker.internet.ip(),
          lastIpAddress: faker.internet.ip(),
          platform: faker.random.word(),
          userId: deviceMutation.userId
        }
      })

      await prismaClient.decryptionChallenge.create({
        data: {
          id: challenge.id,
          userId: deviceMutation.userId,
          deviceId: deviceMutation.id,
          deviceName: faker.random.word(),
          ipAddress: faker.internet.ip()
        }
      })

      expect(await deviceMutation.logout(fakeCtx)).toMatchObject({
        id: deviceMutation.id,
        logoutAt: expect.any(Date),
        userId: deviceMutation.userId
      })
    })

    it('master device logout', async () => {
      // Create mock objects
      const fakeCtx = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        reply: { setCookie: () => {}, clearCookie: () => {} },
        request: { headers: {} },
        prisma: prismaClient,
        jwtPayload: { userId: userId },
        masterDeviceId: deviceMutation.id,
        getIpAddress: () => faker.internet.ip()
      } as any

      await prismaClient.device.create({
        data: {
          id: deviceMutation.id,
          name: faker.random.word(),
          firebaseToken: faker.datatype.string(5),
          firstIpAddress: faker.internet.ip(),
          lastIpAddress: faker.internet.ip(),
          platform: faker.random.word(),
          userId: deviceMutation.userId
        }
      })

      await prismaClient.decryptionChallenge.create({
        data: {
          id: challenge.id,
          userId: deviceMutation.userId,
          deviceId: deviceMutation.id,
          deviceName: faker.random.word(),
          ipAddress: faker.internet.ip()
        }
      })

      expect(await deviceMutation.logout(fakeCtx)).toMatchObject({
        id: deviceMutation.id,
        logoutAt: expect.any(Date),
        userId: deviceMutation.userId
      })
    })
  })
})
