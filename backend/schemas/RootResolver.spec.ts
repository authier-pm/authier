import { prismaClient } from '../prisma/prismaClient'
import { IContextAuthenticated, RootResolver } from './RootResolver'
import faker, { fake } from 'faker'
import {
  AddNewDeviceInput,
  RegisterNewAccountInput
} from '../models/AuthInputs'
import { GraphQLResolveInfo } from 'graphql'

import { sign } from 'jsonwebtoken'
import { makeFakeCtx } from '../tests/makeFakeCtx'
import { DecryptionChallengeApproved } from '../models/DecryptionChallenge'

export const makeAddNewDeviceInput = () => ({
  email: faker.internet.email(),
  deviceName: faker.internet.userName(),
  deviceId: faker.datatype.uuid(),
  firebaseToken: faker.datatype.uuid(),
  addDeviceSecret: faker.datatype.string(5),
  addDeviceSecretEncrypted: faker.datatype.string(5),
  decryptionChallengeId: faker.datatype.number(),
  deviceRecoveryCooldownMinutes: faker.datatype.number()
})

export const makeRegisterAccountInput = () => ({
  ...makeAddNewDeviceInput(),
  encryptionSalt: faker.datatype.string(5)
})

const userSecurityProps = {
  deviceRecoveryCooldownMinutes: 960,
  loginCredentialsLimit: 50,
  TOTPlimit: 4
}

describe('RootResolver', () => {
  const resolver = new RootResolver()

  describe('me', () => {
    it('should return current user', async () => {
      const user = await prismaClient.user.create({
        data: {
          id: faker.datatype.uuid(),
          email: faker.internet.email(),
          addDeviceSecret: faker.datatype.string(5),
          addDeviceSecretEncrypted: faker.datatype.string(5),
          encryptionSalt: faker.datatype.string(5),
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
          {} as any
        )
      ).toMatchObject(user)
    })
  })

  describe('logout', () => {
    it('should clear both cookies', async () => {})
    it('should increment tokenVersion for the current user', async () => {})
  })

  describe('registerNewUser', () => {
    beforeEach(() => {
      jest.setTimeout(10000)
    })
    const userId = faker.datatype.uuid()

    it('should add new user', async () => {
      let input: RegisterNewAccountInput = makeRegisterAccountInput()

      const accessToken = sign(
        { userId: userId, deviceId: input.deviceId },
        process.env.ACCESS_TOKEN_SECRET!,
        {
          expiresIn: '60m'
        }
      )

      let data = await resolver.registerNewUser(
        input,
        userId,
        makeFakeCtx(userId)
      )

      expect({
        accessToken: data.accessToken,
        email: data.user.email
      }).toMatchObject({ accessToken: accessToken, email: input.email })

      await prismaClient.settingsConfig.deleteMany()
      await prismaClient.device.deleteMany()
      await prismaClient.user.deleteMany()
    })

    it('should throw User with such email already exists', async () => {
      let input: RegisterNewAccountInput = makeRegisterAccountInput()
      await prismaClient.user.create({
        data: {
          id: faker.datatype.uuid(),
          email: input.email,
          addDeviceSecret: input.addDeviceSecret,
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          encryptionSalt: input.encryptionSalt,
          ...userSecurityProps
        }
      })

      await expect(
        async () =>
          await resolver.registerNewUser(input, userId, makeFakeCtx(userId))
      ).rejects.toThrow('User with such email already exists.')
    })

    it("should show 'Device already exists. You cannot register this device for multiple accounts.'", async () => {
      let userId = faker.datatype.uuid()

      let input: RegisterNewAccountInput = makeRegisterAccountInput()
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
              firstIpAddress: faker.internet.ip(),
              lastIpAddress: faker.internet.ip(),
              firebaseToken: faker.datatype.uuid(),
              name: input.deviceName
            }
          }
        }
      })

      await expect(
        async () =>
          await resolver.registerNewUser(
            input,
            faker.datatype.uuid(),
            makeFakeCtx(userId)
          )
      ).rejects.toThrow(
        'Device already exists. You cannot register this device for multiple accounts.'
      )
    })
  })

  describe('deviceDecryptionChallenge', () => {
    it('should return a decryption challenge', async () => {
      let userId = faker.datatype.uuid()
      let fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
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

      let data = (await resolver.deviceDecryptionChallenge(
        fakeData.email,
        faker.datatype.uuid(),
        makeFakeCtx(userId)
      )) as DecryptionChallengeApproved

      expect(data?.addDeviceSecretEncrypted).toBe(
        fakeData.addDeviceSecretEncrypted
      )
    })

    it("should show 'Too many decryption challenges, wait for cooldown'", async () => {
      let userId = faker.datatype.uuid()

      let fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
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
        masterPasswordVerifiedAt: null
      }))

      await prismaClient.decryptionChallenge.createMany({
        data
      })

      await expect(async () => {
        await resolver.deviceDecryptionChallenge(
          fakeData.email,
          faker.datatype.uuid(),
          makeFakeCtx(userId)
        )
      }).rejects.toThrow('Too many decryption challenges, wait for cooldown')
    })

    it.todo(
      'should block creation of a challenge from an IP which was blocked previously'
    )
  })
})
