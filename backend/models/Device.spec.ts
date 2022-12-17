import { prismaClient } from '../prisma/prismaClient'
import { RegisterNewAccountInput } from '../models/AuthInputs'
import { makeRegisterAccountInput } from '../schemas/RootResolver.spec'
import { DecryptionChallengeApproved } from './DecryptionChallenge'
import { User } from '.prisma/client'
import faker from 'faker'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import { DeviceMutation } from './Device'

describe('Device', () => {
  let user: User

  const masterDeviceId = faker.datatype.uuid()
  const slaveDeviceId = faker.datatype.uuid()
  const userId = faker.datatype.uuid()
  const slaveDeviceChallenge = faker.datatype.number()

  const challenge: DecryptionChallengeApproved =
    new DecryptionChallengeApproved()
  const deviceMutation = new DeviceMutation()

  challenge.id = faker.datatype.number()
  challenge.blockIp = false
  challenge.deviceId = faker.datatype.uuid()
  challenge.deviceName = faker.random.word()

  const input: RegisterNewAccountInput = makeRegisterAccountInput()

  beforeEach(async () => {
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

    //Master device
    await prismaClient.device.create({
      data: {
        id: masterDeviceId,
        name: faker.random.word(),
        firebaseToken: faker.datatype.string(5),
        firstIpAddress: faker.internet.ip(),
        lastIpAddress: faker.internet.ip(),
        platform: faker.random.word(),
        userId: userId
      }
    })

    //Slave device
    await prismaClient.device.create({
      data: {
        id: slaveDeviceId,
        name: faker.random.word(),
        firebaseToken: faker.datatype.string(5),
        firstIpAddress: faker.internet.ip(),
        lastIpAddress: faker.internet.ip(),
        platform: faker.random.word(),
        userId: userId
      }
    })

    await prismaClient.decryptionChallenge.create({
      data: {
        id: slaveDeviceChallenge,
        userId: userId,
        deviceId: slaveDeviceId,
        deviceName: faker.random.word(),
        ipAddress: faker.internet.ip()
      }
    })
  })

  afterEach(async () => {
    const deleteChallenges = prismaClient.decryptionChallenge.deleteMany()
    const deleteDevices = prismaClient.device.deleteMany()
    const deleteUser = prismaClient.user.deleteMany()

    await prismaClient.$transaction([
      deleteChallenges,
      deleteDevices,
      deleteUser
    ])

    await prismaClient.$disconnect()
  })

  describe('logout', async () => {
    it('slave device logout', async () => {
      //Device info
      deviceMutation.id = slaveDeviceId
      deviceMutation.userId = userId
      deviceMutation.name = challenge.deviceName

      // Create mock objects
      const fakeCtx = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        reply: { setCookie: () => {}, clearCookie: () => {} },
        request: { headers: {} },
        prisma: prismaClient,
        jwtPayload: { userId: userId },
        masterDeviceId: masterDeviceId,
        getIpAddress: () => faker.internet.ip()
      } as any

      const logout = await deviceMutation.logout(fakeCtx)

      const challenges = await prismaClient.decryptionChallenge.findMany({
        where: {
          deviceId: slaveDeviceId,
          approvedAt: null
        }
      })

      expect(challenges).toHaveLength(0)

      expect(logout).toMatchObject({
        id: slaveDeviceId,
        logoutAt: expect.any(Date),
        userId: deviceMutation.userId
      })
    })

    it('master device logout', async () => {
      //Device info
      deviceMutation.id = masterDeviceId
      deviceMutation.userId = userId
      deviceMutation.name = challenge.deviceName

      // Create mock objects
      const fakeCtx = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        reply: { setCookie: () => {}, clearCookie: () => vi.fn() },
        request: { headers: {} },
        prisma: prismaClient,
        jwtPayload: { userId: userId },
        masterDeviceId: masterDeviceId,
        getIpAddress: () => faker.internet.ip()
      } as any

      const logout = await deviceMutation.logout(fakeCtx)

      const challenges = await prismaClient.decryptionChallenge.findMany({
        where: {
          deviceId: masterDeviceId,
          approvedAt: { not: null }
        }
      })

      //TODO: How to test clearCookie??
      const spy = vi.spyOn(fakeCtx.reply, 'clearCookie')
      expect(spy.getMockName()).toEqual('clearCookie')
      expect(challenges).toHaveLength(1)
      expect(logout).toMatchObject({
        id: deviceMutation.id,
        logoutAt: expect.any(Date),
        userId: deviceMutation.userId
      })
    })
  })

  describe('removeDevice', async () => {
    it.todo("should show 'You cannot remove master device from list.'")
    // 1. check if device and hist challenge was removed
  })
})
