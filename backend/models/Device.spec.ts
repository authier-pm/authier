import { db } from '../prisma/prismaClient'
import type { RegisterNewAccountInput } from '../models/AuthInputs'
import { makeRegisterAccountInput } from '../schemas/__test__/makeRegisterAccountInput'
import { DecryptionChallengeApproved } from './DecryptionChallenge'
import type { InferSelectModel } from 'drizzle-orm'
import * as schema from '../drizzle/schema'
import { eq } from 'drizzle-orm'
import { faker } from '@faker-js/faker'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DeviceMutation, DeviceQuery } from './Device'
import { EncryptedSecretTypeGQL } from './types/EncryptedSecretType'
import { defaultDeviceSettingSystemValues } from './defaultDeviceSettingSystemValues'

type User = InferSelectModel<typeof schema.user>

describe('Device', () => {
  let user: User

  const masterDeviceId = crypto.randomUUID()
  const slaveDeviceId = crypto.randomUUID()
  const masterDeviceName = faker.lorem.word()
  const slaveDeviceName = faker.lorem.word()
  const slaveDeviceApproved = faker.date.recent()
  const userId = crypto.randomUUID()
  const slaveDeviceChallenge = faker.number.int({ max: 1000, min: 1 })
  const TOTPlimit = faker.number.int({ min: 4, max: 20 })
  const loginCredentialsLimit = faker.number.int({ min: 4, max: 20 })

  const challenge: DecryptionChallengeApproved =
    new DecryptionChallengeApproved()
  const deviceMutation = new DeviceMutation()
  const deviceQuery = new DeviceQuery()

  challenge.id = faker.number.int({ max: 1000, min: 1 })
  challenge.blockIp = false
  challenge.deviceId = crypto.randomUUID()
  challenge.deviceName = faker.lorem.word()

  const input: RegisterNewAccountInput = makeRegisterAccountInput()

  beforeEach(async () => {
    const [insertedUser] = await db
      .insert(schema.user)
      .values({
        id: userId,
        email: input.email,
        addDeviceSecret: input.addDeviceSecret,
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
        encryptionSalt: input.encryptionSalt,
        loginCredentialsLimit,
        TOTPlimit: TOTPlimit,
        deviceRecoveryCooldownMinutes: 960
      })
      .returning()
    user = insertedUser

    //Master device
    await db.insert(schema.device).values({
      id: masterDeviceId,
      name: faker.lorem.word(),
      firebaseToken: crypto.randomUUID(),
      firstIpAddress: faker.internet.ip(),
      lastIpAddress: faker.internet.ip(),
      platform: faker.lorem.word(),
      userId: userId,
      ...defaultDeviceSettingSystemValues
    })

    //Slave device
    await db.insert(schema.device).values({
      id: slaveDeviceId,
      name: faker.lorem.word(),
      firebaseToken: crypto.randomUUID(),
      firstIpAddress: faker.internet.ip(),
      lastIpAddress: faker.internet.ip(),
      platform: faker.lorem.word(),
      userId: userId,
      ...defaultDeviceSettingSystemValues
    })

    await db.insert(schema.decryptionChallenge).values({
      id: slaveDeviceChallenge,
      userId: userId,
      deviceId: slaveDeviceId,
      deviceName: slaveDeviceName,
      ipAddress: faker.internet.ip(),
      approvedAt: slaveDeviceApproved
    })
  })

  afterEach(async () => {
    await db
      .delete(schema.decryptionChallenge)
      .where(eq(schema.decryptionChallenge.userId, userId))
    await db
      .delete(schema.encryptedSecret)
      .where(eq(schema.encryptedSecret.userId, userId))
    await db.delete(schema.device).where(eq(schema.device.userId, userId))
    await db.delete(schema.user).where(eq(schema.user.id, userId))
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
        db,
        jwtPayload: { userId: userId },
        masterDeviceId: masterDeviceId,
        getIpAddress: () => faker.internet.ip()
      } as unknown as Parameters<DeviceMutation['logout']>[0]

      const logout = await deviceMutation.logout(fakeCtx)

      const challenges = await db.query.decryptionChallenge.findFirst({
        where: { deviceId: slaveDeviceId }
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
        db,
        jwtPayload: { userId: userId },
        masterDeviceId: masterDeviceId,
        getIpAddress: () => faker.internet.ip()
      } as unknown as Parameters<DeviceMutation['logout']>[0]

      const logout = await deviceMutation.logout(fakeCtx)

      const challenges = await db.query.decryptionChallenge.findMany({
        where: { deviceId: masterDeviceId }
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
        db,
        jwtPayload: { userId: userId },
        masterDeviceId: masterDeviceId,
        getIpAddress: () => faker.internet.ip()
      } as unknown as Parameters<DeviceMutation['removeDevice']>[0]

      const wasRemoved = await deviceMutation.removeDevice(fakeCtx)

      const devices = await db.query.device.findMany({
        where: { id: slaveDeviceId }
      })

      const challenges = await db.query.decryptionChallenge.findMany({
        where: { deviceId: slaveDeviceId }
      })

      expect(wasRemoved).toBeTruthy()
      expect(devices).toHaveLength(0)
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
        db,
        jwtPayload: { userId: userId },
        masterDeviceId: masterDeviceId,
        getIpAddress: () => faker.internet.ip()
      } as unknown as Parameters<DeviceMutation['removeDevice']>[0]

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
        db,
        jwtPayload: { userId: userId },
        masterDeviceId: masterDeviceId,
        getIpAddress: () => faker.internet.ip()
      } as unknown as Parameters<DeviceMutation['rename']>[0]

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

    // Create mock objects
    const fakeCtx = {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      reply: { setCookie: () => {}, clearCookie: () => vi.fn() },
      request: { headers: {} },
      device: {
        syncTOTP: true
      },
      db,
      jwtPayload: { userId: userId },
      masterDeviceId: masterDeviceId,
      getIpAddress: () => faker.internet.ip()
    } as unknown as Parameters<DeviceQuery['encryptedSecretsToSync']>[0]

    it('No limit exceeded', async () => {
      //Generate fake secrets for user
      const testData = Array.from(
        { length: user.loginCredentialsLimit },
        () => ({
          id: crypto.randomUUID(),
          encrypted: faker.string.sample(25),
          kind: 'LOGIN_CREDENTIALS' as const,
          userId: userId,
          version: 1
        })
      )

      await db.insert(schema.encryptedSecret).values(testData)

      const secrets = await deviceQuery.encryptedSecretsToSync(fakeCtx)

      expect(secrets).toHaveLength(user.loginCredentialsLimit)
    })

    it('should not sync TOTP when device has syncTOTP set to false', async () => {
      const testData = Array.from({ length: user.TOTPlimit }, () => ({
        id: crypto.randomUUID(),
        encrypted: faker.string.sample(25),
        kind: 'TOTP' as const,
        userId: userId,
        version: 1
      }))

      ;(fakeCtx as { device: { syncTOTP: boolean } }).device.syncTOTP = false
      await db.insert(schema.encryptedSecret).values(testData)
      const res = await deviceQuery.encryptedSecretsToSync(fakeCtx)

      expect(res).toHaveLength(0)
      ;(fakeCtx as { device: { syncTOTP: boolean } }).device.syncTOTP = true
    })

    it("should show 'TOTP limit exceeded, remove TOTP secrets'", async () => {
      //Generate fake secrets for user
      const numOverLimit = 5

      const testData = Array.from(
        { length: user.TOTPlimit + numOverLimit },
        () => ({
          id: crypto.randomUUID(),
          encrypted: faker.string.sample(25),
          kind: 'TOTP' as const,
          userId: userId,
          version: 1
        })
      )

      await db.insert(schema.encryptedSecret).values(testData)

      await expect(
        async () => await deviceQuery.encryptedSecretsToSync(fakeCtx)
      ).rejects.toThrow(/TOTP limit exceeded, remove \d+ TOTP secrets/)
    })
  })
})
