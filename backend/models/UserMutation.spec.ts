import { User } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { plainToClass } from 'class-transformer'
import { prismaClient } from '../prisma/prismaClient'
import { makeFakeCtx } from 'tests/makeFakeCtx'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { UserMutation } from './UserMutation'
import { EncryptedSecretTypeGQL } from './types/EncryptedSecretType'
import { EncryptedSecretInput, SettingsInput } from './models'
import { defaultDeviceSettingSystemValues } from './defaultDeviceSettingSystemValues'

describe('UserMutation', () => {
  const masterDeviceId = faker.string.uuid()
  const masterDeviceName = faker.lorem.word()
  let userRaw: User
  beforeAll(async () => {
    userRaw = await prismaClient.user.create({
      data: {
        email: faker.internet.email(),
        loginCredentialsLimit: 3,
        TOTPlimit: 3,
        deviceRecoveryCooldownMinutes: 960,
        addDeviceSecret: faker.string.sample(5),
        addDeviceSecretEncrypted: faker.string.sample(5),
        encryptionSalt: faker.string.sample(5)
      }
    })

    await prismaClient.device.create({
      data: {
        id: masterDeviceId,
        User: {
          connect: {
            id: userRaw.id
          }
        },
        name: masterDeviceName,
        firebaseToken: faker.string.sample(5),
        firstIpAddress: faker.internet.ip(),
        lastIpAddress: faker.internet.ip(),
        platform: 'ios',
        ...defaultDeviceSettingSystemValues
      }
    })
  })

  afterAll(async () => {
    const deleteSecrets = prismaClient.encryptedSecret.deleteMany()
    const deleteDevices = prismaClient.device.deleteMany()
    const deleteUser = prismaClient.user.deleteMany()

    await prismaClient.$transaction([deleteSecrets, deleteDevices, deleteUser])

    await prismaClient.$disconnect()
  })

  describe('updateEmail', () => {
    it('should update email', async () => {
      userRaw = await prismaClient.user.update({
        data: {
          masterDeviceId
        },
        where: {
          id: userRaw.id
        }
      })

      const user = plainToClass(UserMutation, userRaw)

      const newEmail = faker.internet.email()
      const res = await user.changeEmail(
        newEmail,
        makeFakeCtx({
          userId: user.id,
          device: {
            id: masterDeviceId
          } as any
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
            updatedAt: expect.any(Date),
            deletedAt: null,
            userId: userRaw.id
          })
        )
      })
    })

    it('should remove secrets', async () => {
      const user = plainToClass(UserMutation, userRaw)
      const dataInDB = await prismaClient.encryptedSecret.findMany({
        where: {
          userId: userRaw.id
        }
      })

      const input = dataInDB.map((secret) => secret.id)

      const removedData = await user.removeEncryptedSecrets(
        input,
        makeFakeCtx({ userId: userRaw.id })
      )

      expect(removedData).toHaveLength(dataInDB.length)

      const dataInDBAfter = await prismaClient.encryptedSecret.findMany({
        where: {
          userId: userRaw.id
        }
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
          } as any
        })
      )

      const deviceData = await prismaClient.device.findFirst({
        where: {
          id: masterDeviceId
        }
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
