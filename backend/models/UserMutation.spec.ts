import type { InferSelectModel } from 'drizzle-orm'
import * as schema from '../drizzle/schema'
import { eq } from 'drizzle-orm'
import { db } from '../prisma/prismaClient'
import { faker } from '@faker-js/faker'
import { plainToClass } from 'class-transformer'
import { makeFakeCtx } from '../tests/makeFakeCtx'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { UserMutation } from './UserMutation'
import { EncryptedSecretTypeGQL } from './types/EncryptedSecretType'
import type { EncryptedSecretInput, SettingsInput } from './models'
import { defaultDeviceSettingSystemValues } from './defaultDeviceSettingSystemValues'

type User = InferSelectModel<typeof schema.user>

describe('UserMutation', () => {
  const masterDeviceId = crypto.randomUUID()
  const masterDeviceName = faker.lorem.word()
  let userRaw: User
  beforeAll(async () => {
    const [insertedUser] = await db
      .insert(schema.user)
      .values({
        email: `${crypto.randomUUID()}@test.com`,
        id: crypto.randomUUID(),
        loginCredentialsLimit: 3,
        TOTPlimit: 3,
        deviceRecoveryCooldownMinutes: 960,
        addDeviceSecret: faker.string.sample(5),
        addDeviceSecretEncrypted: faker.string.sample(5),
        encryptionSalt: faker.string.sample(5)
      })
      .returning()
    userRaw = insertedUser

    await db.insert(schema.device).values({
      id: masterDeviceId,
      userId: userRaw.id,
      name: masterDeviceName,
      firebaseToken: crypto.randomUUID(),
      firstIpAddress: faker.internet.ip(),
      lastIpAddress: faker.internet.ip(),
      platform: 'ios',
      ...defaultDeviceSettingSystemValues
    })
  })

  afterAll(async () => {
    await db
      .delete(schema.encryptedSecret)
      .where(eq(schema.encryptedSecret.userId, userRaw.id))
    await db.delete(schema.device).where(eq(schema.device.userId, userRaw.id))
    await db.delete(schema.user).where(eq(schema.user.id, userRaw.id))
  })

  describe('updateEmail', () => {
    it('should update email', async () => {
      const [updated] = await db
        .update(schema.user)
        .set({
          masterDeviceId
        })
        .where(eq(schema.user.id, userRaw.id))
        .returning()
      userRaw = updated

      const user = plainToClass(UserMutation, userRaw)

      const newEmail = faker.internet.email()
      const res = await user.changeEmail(
        newEmail,
        makeFakeCtx({
          userId: user.id,
          device: {
            id: masterDeviceId
          } as Parameters<typeof makeFakeCtx>[0]['device']
        })
      )

      expect(res.email).toBe(newEmail)
      // expect(sentEmails.length).toBe(1) // TODO figure out why this is not working
    })
  })

  describe('changeMasterPassword', () => {
    it.todo(
      'should change master password and increment token version to force user to relog on all other devices'
    )

    it.todo('should throw error when user is not ona master device')
  })

  describe('Secret manipulation', async () => {
    const testData: EncryptedSecretInput[] = []

    it('should add secrets', async () => {
      const user = plainToClass(UserMutation, userRaw)
      for (let i = 0; i < user.loginCredentialsLimit; i++) {
        testData.push({
          encrypted: faker.string.sample(25),
          kind: EncryptedSecretTypeGQL.LOGIN_CREDENTIALS
        })
      }

      const data = await user.addEncryptedSecrets(
        testData,
        makeFakeCtx({ userId: userRaw.id })
      )

      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(user.loginCredentialsLimit)
      testData.forEach((testSecret, i) => {
        expect(data[i]).toEqual(
          expect.objectContaining({
            encrypted: testSecret.encrypted,
            kind: testSecret.kind,
            version: 1,
            id: expect.any(String),
            createdAt: expect.any(Date),
            userId: userRaw.id
          })
        )
      })
    })

    it('should remove secrets', async () => {
      const user = plainToClass(UserMutation, userRaw)
      const dataInDB = await db.query.encryptedSecret.findMany({
        where: { userId: userRaw.id }
      })

      const input = dataInDB.map((secret) => secret.id)

      const removedData = await user.removeEncryptedSecrets(
        input,
        makeFakeCtx({ userId: userRaw.id })
      )

      expect(removedData).toHaveLength(dataInDB.length)

      const dataInDBAfter = await db.query.encryptedSecret.findMany({
        where: { userId: userRaw.id }
      })

      dataInDBAfter.forEach((secret) => {
        expect(secret.deletedAt).toBeInstanceOf(Date)
      })
    })
  })
  describe('updateSettings', () => {
    it('Should update settings', async () => {
      const user = plainToClass(UserMutation, userRaw)

      const newSettings: SettingsInput = {
        syncTOTP: true,
        vaultLockTimeoutSeconds: 3600,
        uiLanguage: 'cs',
        autofillCredentialsEnabled: false,
        autofillTOTPEnabled: false,
        notificationOnVaultUnlock: false,
        notificationOnWrongPasswordAttempts: 3
      }

      const res = await user.updateSettings(
        newSettings,
        makeFakeCtx({
          userId: user.id,
          device: {
            id: masterDeviceId
          } as Parameters<typeof makeFakeCtx>[0]['device']
        })
      )

      const deviceData = await db.query.device.findFirst({
        where: { id: masterDeviceId }
      })
      //TODO: Eventually add all settings
      expect(res.uiLanguage).toBe(newSettings.uiLanguage)
      expect(deviceData?.vaultLockTimeoutSeconds).toBe(
        newSettings.vaultLockTimeoutSeconds
      )
      expect(deviceData?.syncTOTP).toBe(newSettings.syncTOTP)
    })
  })

  describe('delete', () => {
    it.todo('should delete user', async () => {})
  })
})
