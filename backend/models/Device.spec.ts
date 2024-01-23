import { prismaClient } from '../prisma/prismaClient'
import { RegisterNewAccountInput } from '../models/AuthInputs'
import { makeRegisterAccountInput } from '../schemas/__test__/makeRegisterAccountInput'
import { DecryptionChallengeApproved } from './DecryptionChallenge'
import { User } from '.prisma/client'
import { faker } from '@faker-js/faker'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DeviceMutation, DeviceQuery } from './Device'
import { EncryptedSecretTypeGQL } from './types/EncryptedSecretType'
import { defaultDeviceSettingSystemValues } from './defaultDeviceSettingSystemValues'

describe('Device', () => {
  let user: User

  const masterDeviceId = faker.string.uuid()
  const slaveDeviceId = faker.string.uuid()
  const masterDeviceName = faker.lorem.word()
  const slaveDeviceName = faker.lorem.word()
  const slaveDeviceApproved = faker.date.recent()
  const userId = faker.string.uuid()
  const slaveDeviceChallenge = faker.number.int({ max: 1000, min: 1 })
  const TOTPlimit = faker.number.int({ min: 4, max: 20 })
  const loginCredentialsLimit = faker.number.int({ min: 4, max: 20 })

  const challenge: DecryptionChallengeApproved =
    new DecryptionChallengeApproved()
  const deviceMutation = new DeviceMutation()
  const deviceQuery = new DeviceQuery()

  challenge.id = faker.number.int({ max: 1000, min: 1 })
  challenge.blockIp = false
  challenge.deviceId = faker.string.uuid()
  challenge.deviceName = faker.lorem.word()

  const input: RegisterNewAccountInput = makeRegisterAccountInput()

  beforeEach(async () => {
    user = await prismaClient.user.create({
      data: {
        id: userId,
        email: input.email,
        addDeviceSecret: input.addDeviceSecret,
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
        encryptionSalt: input.encryptionSalt,
        loginCredentialsLimit,
        TOTPlimit,
        deviceRecoveryCooldownMinutes: 960
      }
    })

    //Master device
    await prismaClient.device.create({
      data: {
        id: masterDeviceId,
        name: faker.lorem.word(),
        firebaseToken: faker.string.sample(5),
        firstIpAddress: faker.internet.ip(),
        lastIpAddress: faker.internet.ip(),
        platform: faker.lorem.word(),
        userId: userId,
        ...defaultDeviceSettingSystemValues
      }
    })

    //Slave device
    await prismaClient.device.create({
      data: {
        id: slaveDeviceId,
        name: faker.lorem.word(),
        firebaseToken: faker.string.sample(5),
        firstIpAddress: faker.internet.ip(),
        lastIpAddress: faker.internet.ip(),
        platform: faker.lorem.word(),
        userId: userId,
        ...defaultDeviceSettingSystemValues
      }
    })

    await prismaClient.decryptionChallenge.create({
      data: {
        id: slaveDeviceChallenge,
        userId: userId,
        deviceId: slaveDeviceId,
        deviceName: slaveDeviceName,
        ipAddress: faker.internet.ip(),
        approvedAt: slaveDeviceApproved
      }
    })
  })

  afterEach(async () => {
    const deleteChallenges = prismaClient.decryptionChallenge.deleteMany()
    const deleteSecrets = prismaClient.encryptedSecret.deleteMany()
    const deleteDevices = prismaClient.device.deleteMany()
    const deleteUser = prismaClient.user.deleteMany()

    await prismaClient.$transaction([
      deleteChallenges,
      deleteSecrets,
      deleteDevices,
      deleteUser
    ])

    await prismaClient.$disconnect()
  })

  describe('logout', async () => {
    deviceMutation.userId = userId

    it('slave device logout', async () => {
      //Device info
      deviceMutation.id = slaveDeviceId
      deviceMutation.name = slaveDeviceName

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

      const challenges = await prismaClient.decryptionChallenge.findFirst({
        where: {
          deviceId: slaveDeviceId
        }
      })

      expect(challenges).toMatchObject({
        id: slaveDeviceChallenge,
        userId: userId,
        deviceId: slaveDeviceId,
        deviceName: slaveDeviceName,
        approvedAt: slaveDeviceApproved
      })

      expect(logout).toMatchObject({
        id: slaveDeviceId,
        logoutAt: expect.any(Date),
        userId: deviceMutation.userId
      })
    })

    it('master device logout', async () => {
      //Device info
      deviceMutation.id = masterDeviceId
      deviceMutation.name = masterDeviceName

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
          deviceId: masterDeviceId
        }
      })

      //FIX: How to test clearCookie??
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
    deviceMutation.userId = userId

    it('Should remove slave device from user and DB', async () => {
      //Device info
      deviceMutation.id = slaveDeviceId
      deviceMutation.name = slaveDeviceName

      // Create mock objects
      const fakeCtx = {
        reply: { setCookie: () => {}, clearCookie: () => vi.fn() },
        request: { headers: {} },
        prisma: prismaClient,
        jwtPayload: { userId: userId },
        masterDeviceId: masterDeviceId,
        getIpAddress: () => faker.internet.ip()
      } as any

      const wasRemoved = await deviceMutation.removeDevice(fakeCtx)

      const device = await prismaClient.device.findMany({
        where: {
          id: slaveDeviceId
        }
      })

      const challenges = await prismaClient.decryptionChallenge.findMany({
        where: {
          deviceId: slaveDeviceId
        }
      })

      expect(wasRemoved).toBeTruthy()
      expect(device).toHaveLength(0)
      expect(challenges).toHaveLength(0)
    })

    it("Should show 'You cannot remove master device from list.'", async () => {
      //Device info
      deviceMutation.id = masterDeviceId
      deviceMutation.name = masterDeviceName

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

      await expect(
        async () => await deviceMutation.removeDevice(fakeCtx)
      ).rejects.toThrow('You cannot remove master device from list.')
    })
  })

  describe('rename', async () => {
    it('Should rename device', async () => {
      //Device info
      deviceMutation.id = masterDeviceId
      deviceMutation.userId = userId
      deviceMutation.name = masterDeviceName
      const newName = faker.lorem.word()

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

      const rename = await deviceMutation.rename(fakeCtx, newName)

      expect(rename).toMatchObject({
        name: newName,
        id: masterDeviceId
      })
    })
  })

  describe('encryptedSecretsToSync', async () => {
    //Device info
    deviceQuery.lastSyncAt = faker.date.past({ years: 1 })
    deviceQuery.userId = userId

    const testData: any = []

    // Create mock objects
    const fakeCtx = {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      reply: { setCookie: () => {}, clearCookie: () => vi.fn() },
      request: { headers: {} },
      device: {
        syncTOTP: true
      },
      prisma: prismaClient,
      jwtPayload: { userId: userId },
      masterDeviceId: masterDeviceId,
      getIpAddress: () => faker.internet.ip()
    } as any

    it('No limit exceeded', async () => {
      //Generate fake secrets for user

      for (let i = 0; i < user.loginCredentialsLimit; i++) {
        testData.push({
          encrypted: faker.string.sample(25),
          kind: EncryptedSecretTypeGQL.LOGIN_CREDENTIALS,
          userId: userId,
          version: 1
        })
      }

      await prismaClient.encryptedSecret.createMany({
        data: testData
      })

      const secrets = await deviceQuery.encryptedSecretsToSync(fakeCtx)

      expect(secrets).toHaveLength(user.loginCredentialsLimit)
      testData.length = 0
    })

    it('should not sync TOTP when device has syncTOTP set to false', async () => {
      for (let i = 0; i < user.TOTPlimit; i++) {
        testData.push({
          encrypted: faker.string.sample(25),
          kind: EncryptedSecretTypeGQL.TOTP,
          userId: userId,
          version: 1
        })
      }
      fakeCtx.device.syncTOTP = false
      await prismaClient.encryptedSecret.createMany({
        data: testData
      })
      const res = await deviceQuery.encryptedSecretsToSync(fakeCtx)

      expect(res).toHaveLength(0)

      fakeCtx.device.syncTOTP = true
    })

    it("should show 'TOTP limit exceeded, remove TOTP secrets'", async () => {
      //Generate fake secrets for user
      const numOverLimit = 5
      //TODO: Make function for generating random secrets, revise this code and remove duplicate lines

      for (let i = 0; i < numOverLimit; i++) {
        testData.push({
          encrypted: faker.string.sample(25),
          kind: EncryptedSecretTypeGQL.TOTP,
          userId: userId,
          version: 1
        })
      }

      await prismaClient.encryptedSecret.createMany({
        data: testData
      })

      await expect(
        async () => await deviceQuery.encryptedSecretsToSync(fakeCtx)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: TOTP limit exceeded, remove 5 TOTP secrets]`
      )
    })
  })
})
