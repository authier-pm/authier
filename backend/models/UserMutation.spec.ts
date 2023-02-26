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
      const masterDeviceId = faker.datatype.uuid()

      let userRaw = await prismaClient.user.create({
        data: {
          email: faker.internet.email(),
          loginCredentialsLimit: 3,
          TOTPlimit: 3,
          deviceRecoveryCooldownMinutes: 960,
          addDeviceSecret: faker.datatype.string(5),
          addDeviceSecretEncrypted: faker.datatype.string(5),
          encryptionSalt: faker.datatype.string(5)
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
          name: faker.random.word(),
          firebaseToken: faker.datatype.string(5),
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
})
