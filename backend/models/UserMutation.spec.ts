import { faker } from '@faker-js/faker'
import { plainToClass } from 'class-transformer'
import prismaClient from 'prisma/prismaClient'
import { makeFakeCtx } from 'tests/makeFakeCtx'
// import { sentEmails } from 'utils/email'
import { describe, expect, it } from 'vitest'
import { UserMutation } from './UserMutation'

describe('UserMutation', () => {
  describe('updateEmail', () => {
    it('should update email', async () => {
      const masterDeviceId = faker.string.uuid()

      let userRaw = await prismaClient.user.create({
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

      const masterDevice = await prismaClient.device.create({
        data: {
          id: masterDeviceId,
          User: {
            connect: {
              id: userRaw.id
            }
          },
          name: faker.lorem.word(),
          firebaseToken: faker.string.sample(5),
          firstIpAddress: faker.internet.ip(),
          lastIpAddress: faker.internet.ip(),
          platform: 'ios'
        }
      })

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
            id: masterDevice.id
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

  describe('Secret manipulation', () => {
    it.todo('should remove secrets', async () => {})
    it.todo('add secrets', async () => {})
  })

  describe('updateSettings', () => {
    it('Should update settings', async () => {
      const masterDeviceId = faker.string.uuid()

      const userRaw = await prismaClient.user.create({
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

      const masterDevice = await prismaClient.device.create({
        data: {
          id: masterDeviceId,
          User: {
            connect: {
              id: userRaw.id
            }
          },
          name: faker.lorem.word(),
          firebaseToken: faker.string.sample(5),
          firstIpAddress: faker.internet.ip(),
          lastIpAddress: faker.internet.ip(),
          platform: 'ios'
        }
      })

      const user = plainToClass(UserMutation, userRaw)

      const newSettings = {
        syncTOTP: true,
        vaultLockTimeoutSeconds: 3600,
        uiLanguage: 'cs',
        autofillCredentialsEnabled: false,
        autofillTOTPEnabled: false
      }

      const res = await user.updateSettings(
        newSettings,
        makeFakeCtx({
          userId: user.id,
          device: {
            id: masterDevice.id
          } as any
        })
      )

      const deviceData = await prismaClient.device.findFirst({
        where: {
          id: masterDevice.id
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
})
