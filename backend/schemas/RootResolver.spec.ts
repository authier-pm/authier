/* eslint-disable @typescript-eslint/no-empty-function */
import { prismaClient } from '../prisma/prismaClient'
import { IContext, IContextAuthenticated, RootResolver } from './RootResolver'
import { faker } from '@faker-js/faker'
import { RegisterNewAccountInput } from '../models/AuthInputs'
import { describe, expect, it } from 'vitest'

import { sign } from 'jsonwebtoken'
import { makeFakeCtx } from '../tests/makeFakeCtx'
import { DecryptionChallengeApproved } from '../models/DecryptionChallenge'
import { WebInputTypeGQL } from '../models/types/WebInputType'
import { fakeUserAndContext } from './__test__/fakeUserAndContext'
import { makeRegisterAccountInput } from './__test__/makeRegisterAccountInput'
import { defaultDeviceSettingSystemValues } from 'models/defaultDeviceSettingSystemValues'
import { GraphQLResolveInfo } from 'graphql'

const userSecurityProps = {
  deviceRecoveryCooldownMinutes: 960,
  loginCredentialsLimit: 50,
  TOTPlimit: 4
}

describe.only('RootResolver', () => {
  const resolver = new RootResolver()

  describe('me', () => {
    it('should return current user', async () => {
      const user = await prismaClient.user.create({
        data: {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          addDeviceSecret: faker.string.sample(5),
          addDeviceSecretEncrypted: faker.string.sample(5),
          encryptionSalt: faker.string.sample(5),
          ...userSecurityProps
        }
      })

      expect(
        await resolver.me(
          {
            request: { headers: {} },
            prisma: prismaClient,
            jwtPayload: { userId: user.id }
          } as IContextAuthenticated,
          {} as GraphQLResolveInfo
        )
      ).toMatchObject(user)
    })
  })

  describe('registerNewUser', () => {
    const userId = faker.string.uuid()

    it('should add new user', async () => {
      const input: RegisterNewAccountInput = makeRegisterAccountInput()

      const accessToken = sign(
        { userId: userId, deviceId: input.deviceId },
        process.env.ACCESS_TOKEN_SECRET!,
        {
          expiresIn: '60m'
        }
      )

      const data = await resolver.registerNewUser(
        input,
        userId,
        makeFakeCtx({ userId })
      )

      expect({
        accessToken: data.accessToken,
        email: data.user.email
      }).toMatchObject({ accessToken: accessToken, email: input.email })

      await prismaClient.device.deleteMany()
      await prismaClient.decryptionChallenge.deleteMany()
      await prismaClient.user.deleteMany()
    })

    it('should throw User with such email already exists', async () => {
      const input: RegisterNewAccountInput = makeRegisterAccountInput()
      await prismaClient.user.create({
        data: {
          id: faker.string.uuid(),
          //Same email
          email: input.email,
          addDeviceSecret: input.addDeviceSecret,
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          encryptionSalt: input.encryptionSalt,
          ...userSecurityProps
        }
      })

      await expect(
        async () =>
          await resolver.registerNewUser(input, userId, makeFakeCtx({ userId }))
      ).rejects.toThrow('User with such email already exists.')
    })

    it("should show 'Device already exists. You cannot register this device for multiple accounts.'", async () => {
      const userId = faker.string.uuid()

      const input: RegisterNewAccountInput = makeRegisterAccountInput()
      await prismaClient.user.create({
        data: {
          id: userId,
          email: faker.internet.email(),
          addDeviceSecret: input.addDeviceSecret,
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          encryptionSalt: input.encryptionSalt,
          ...userSecurityProps,

          Devices: {
            create: {
              id: input.deviceId,
              platform: 'iOS',
              firstIpAddress: faker.internet.ip(),
              lastIpAddress: faker.internet.ip(),
              firebaseToken: faker.string.uuid(),
              name: input.deviceName,
              ...defaultDeviceSettingSystemValues
            }
          }
        }
      })

      await expect(
        async () =>
          await resolver.registerNewUser(
            input,
            faker.string.uuid(),
            makeFakeCtx({ userId })
          )
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Device f025212b-8007-4ffd-a507-21582ec854f5 already exists. You cannot use a device with multiple accounts.]`
      )
    })
  })

  describe('deviceDecryptionChallenge', () => {
    it('should return a DecryptionChallengeForApproval', async () => {
      const userId = faker.string.uuid()
      const fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
      await prismaClient.user.create({
        data: {
          id: userId,
          email: fakeData.email,
          addDeviceSecret: fakeData.addDeviceSecret,
          addDeviceSecretEncrypted: fakeData.addDeviceSecretEncrypted,

          encryptionSalt: fakeData.encryptionSalt,
          ...userSecurityProps
        }
      })

      const data = (await resolver.deviceDecryptionChallenge(
        fakeData.email,
        {
          id: faker.string.uuid(),
          name: 'chrome ',
          platform: 'macOS'
        },
        makeFakeCtx({ userId })
      )) as DecryptionChallengeApproved

      expect(data?.addDeviceSecretEncrypted).toBe(undefined)
    })

    it("should show 'Too many decryption challenges, wait for cooldown'", async () => {
      const userId = faker.string.uuid()

      const fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
      await prismaClient.user.create({
        data: {
          id: userId,
          email: fakeData.email,
          addDeviceSecret: fakeData.addDeviceSecret,
          addDeviceSecretEncrypted: fakeData.addDeviceSecretEncrypted,
          encryptionSalt: fakeData.encryptionSalt,

          ...userSecurityProps
        }
      })

      const data = Array.from({ length: 10 }).map(() => ({
        userId: userId,
        ipAddress: faker.internet.ip(),
        masterPasswordVerifiedAt: null,
        deviceId: faker.string.uuid(),
        deviceName: 'chrome'
      }))

      await prismaClient.decryptionChallenge.createMany({
        data
      })

      await expect(async () => {
        await resolver.deviceDecryptionChallenge(
          fakeData.email,
          {
            id: faker.string.uuid(),
            name: 'chrome ',
            platform: 'macOS'
          },
          makeFakeCtx({ userId })
        )
      }).rejects.toThrow('Too many decryption challenges, wait for cooldown')
    })

    it('should block creation of a challenge from an IP which was blocked previously', async () => {
      const userId = faker.string.uuid()
      const blockedIp = faker.internet.ip()
      const fakeCtx = {
        reply: { setCookie: () => {} },
        request: { headers: {} },
        prisma: prismaClient,
        jwtPayload: { userId: userId },
        getIpAddress: () => blockedIp
      } as any

      const fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
      await prismaClient.user.create({
        data: {
          id: userId,
          email: fakeData.email,
          addDeviceSecret: fakeData.addDeviceSecret,
          addDeviceSecretEncrypted: fakeData.addDeviceSecretEncrypted,
          encryptionSalt: fakeData.encryptionSalt,

          ...userSecurityProps
        }
      })

      await prismaClient.decryptionChallenge.create({
        data: {
          userId: userId,
          ipAddress: blockedIp,
          masterPasswordVerifiedAt: null,
          deviceId: faker.string.uuid(),
          deviceName: 'chrome',
          blockIp: true
        }
      })

      await expect(async () => {
        await resolver.deviceDecryptionChallenge(
          fakeData.email,
          {
            id: faker.string.uuid(),
            name: 'chrome ',
            platform: 'macOS'
          },
          fakeCtx
        )
      }).rejects.toThrow('Login failed, try again later')
    })
  })

  describe.only('addWebInputs', () => {
    it('should add to the DB and omit any url query when storing the url', async () => {
      const { fakeCtx } = await fakeUserAndContext()

      const inputs = await resolver.addWebInputs(
        [
          {
            url: 'https://google.com?query=123',
            kind: WebInputTypeGQL.PASSWORD,
            domOrdinal: 1,
            domPath: 'body'
          }
        ],
        fakeCtx
      )

      expect(inputs).toHaveLength(1)

      // @ts-expect-error
      delete inputs[0].createdAt
      // @ts-expect-error
      delete inputs[0].id
      expect(inputs[0]).toMatchSnapshot()
    })
  })
})
