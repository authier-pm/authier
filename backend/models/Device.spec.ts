import { prismaClient } from '../prisma/prismaClient'
import { RegisterNewAccountInput } from '../models/AuthInputs'
import { makeRegisterAccountInput } from '../schemas/__test__/makeRegisterAccountInput'
import { DecryptionChallengeApproved } from './DecryptionChallenge'
import { User } from '.prisma/client'
import { faker } from '@faker-js/faker'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DeviceMutation, DeviceQuery } from './Device'
import { EncryptedSecretTypeGQL } from './types/EncryptedSecretType'

describe('Device', () => {
  let user: User

  const masterDeviceId = faker.datatype.uuid()
  const slaveDeviceId = faker.datatype.uuid()
  const masterDeviceName = faker.random.word()
  const slaveDeviceName = faker.random.word()
  const userId = faker.datatype.uuid()
  const slaveDeviceChallenge = faker.datatype.number()

  const challenge: DecryptionChallengeApproved =
    new DecryptionChallengeApproved()
  const deviceMutation = new DeviceMutation()
  const deviceQuery = new DeviceQuery()

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
        loginCredentialsLimit: faker.datatype.number(20),
        TOTPlimit: faker.datatype.number(5),
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
      const newName = faker.random.word()

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
    deviceQuery.lastSyncAt = faker.date.past(1)
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
          encrypted: faker.datatype.string(25),
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
    })

    it('should not sync TOTP when device has syncTOTP set to false', async () => {
      testData.push({
        encrypted: faker.datatype.string(25),
        kind: EncryptedSecretTypeGQL.TOTP,
        userId: userId,
        version: 1
      })
      fakeCtx.device.syncTOTP = false
      await prismaClient.encryptedSecret.createMany({
        data: testData
      })

      const res = await deviceQuery.encryptedSecretsToSync(fakeCtx)
      expect(res).toHaveLength(0)

      fakeCtx.device.syncTOTP = true

      testData.length = 0
    })

    it("should show 'TOTP limit exceeded, remove TOTP secrets'", async () => {
      //Generate fake secrets for user
      const numOverLimit = 5
      //TODO: Make function for generating random secrets, revise this code and remove duplicate lines

      for (let i = 0; i < user.TOTPlimit + numOverLimit; i++) {
        testData.push({
          encrypted: faker.datatype.string(25),
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
        '"TOTP limit exceeded, remove 5 TOTP secrets"'
      )
    })
  })
})
