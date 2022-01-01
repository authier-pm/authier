import { prismaClient } from '../prismaClient'
import { IContextAuthenticated, RootResolver } from './RootResolver'
import faker, { fake } from 'faker'
import { RegisterNewDeviceInput } from '../models/AuthInputs'

import { sign } from 'jsonwebtoken'

afterAll(async () => {
  const deleteDevices = prismaClient.device.deleteMany()
  const deleteSettings = prismaClient.settingsConfig.deleteMany()
  const deleteUsers = prismaClient.user.deleteMany()

  await prismaClient.$transaction([deleteDevices, deleteSettings, deleteUsers])

  await prismaClient.$disconnect()
})

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
          loginCredentialsLimit: 50,
          TOTPlimit: 4
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

    const fakeCtx = {
      reply: { setCookie: jest.fn() },
      request: { headers: {} },
      jwtPayload: { userId: userId },
      prisma: prismaClient,
      getIpAddress: () => faker.internet.ip()
    } as any

    it('should add new user', async () => {
      let input: RegisterNewDeviceInput = {
        email: faker.internet.email(),
        deviceName: faker.internet.userName(),
        deviceId: faker.datatype.uuid(),
        firebaseToken: faker.datatype.uuid(),
        addDeviceSecret: faker.datatype.string(5),
        addDeviceSecretEncrypted: faker.datatype.string(5)
      }

      const accessToken = sign(
        { userId: userId, deviceId: input.deviceId },
        process.env.ACCESS_TOKEN_SECRET!,
        {
          expiresIn: '60m'
        }
      )

      let data = await resolver.registerNewUser(input, userId, fakeCtx)

      expect({
        accessToken: data.accessToken,
        email: data.user.email
      }).toMatchObject({ accessToken: accessToken, email: input.email })
    })

    it('should throw User with such email already exists', async () => {
      await prismaClient.settingsConfig.deleteMany()
      await prismaClient.device.deleteMany()
      await prismaClient.user.deleteMany()

      let input: RegisterNewDeviceInput = {
        email: faker.internet.email(),
        deviceName: faker.internet.userName(),
        deviceId: faker.datatype.uuid(),
        firebaseToken: faker.datatype.uuid(),
        addDeviceSecret: faker.datatype.string(5),
        addDeviceSecretEncrypted: faker.datatype.string(5)
      }
      await prismaClient.user.create({
        data: {
          id: faker.datatype.uuid(),
          email: input.email,
          addDeviceSecret: input.addDeviceSecret,
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          loginCredentialsLimit: 50,
          TOTPlimit: 4
        }
      })

      expect(
        async () => await resolver.registerNewUser(input, userId, fakeCtx)
      ).rejects.toThrow('User with such email already exists.')
    })

    it("should show 'Device already exists. You cannot register this device for multiple accounts.'", async () => {
      let userId = faker.datatype.uuid()

      let input: RegisterNewDeviceInput = {
        email: faker.internet.email(),
        deviceName: faker.internet.userName(),
        deviceId: faker.datatype.uuid(),
        firebaseToken: faker.datatype.uuid(),
        addDeviceSecret: faker.datatype.string(5),
        addDeviceSecretEncrypted: faker.datatype.string(5)
      }
      await prismaClient.user.create({
        data: {
          id: userId,
          email: faker.internet.email(),
          addDeviceSecret: input.addDeviceSecret,
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          loginCredentialsLimit: 50,
          TOTPlimit: 4,
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

      expect(
        async () =>
          await resolver.registerNewUser(input, faker.datatype.uuid(), {
            reply: { setCookie: jest.fn() },
            request: { headers: {} },
            jwtPayload: { userId: userId },
            getIpAddress: () => faker.internet.ip()
          } as any)
      ).rejects.toThrow(
        'Device already exists. You cannot register this device for multiple accounts.'
      )
    })
  })

  describe('addNewDeviceForUser', () => {
    let userId = faker.datatype.uuid()
    let fakeCtx = {
      reply: { setCookie: jest.fn() },
      request: { headers: {} },
      jwtPayload: { userId: userId },
      getIpAddress: () => faker.internet.ip()
    } as any
    it('should add new device for user', async () => {
      let input: RegisterNewDeviceInput = {
        email: faker.internet.email(),
        deviceName: faker.internet.userName(),
        deviceId: faker.datatype.uuid(),
        firebaseToken: faker.datatype.uuid(),
        addDeviceSecret: faker.datatype.string(5),
        addDeviceSecretEncrypted: faker.datatype.string(5)
      }

      await prismaClient.user.create({
        data: {
          id: userId,
          email: input.email,
          addDeviceSecret: input.addDeviceSecret,
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          loginCredentialsLimit: 50,
          TOTPlimit: 4
        }
      })

      let data = await resolver.addNewDeviceForUser(
        input,
        input.addDeviceSecret,
        fakeCtx
      )

      const accessToken = sign(
        { userId: userId, deviceId: input.deviceId },
        process.env.ACCESS_TOKEN_SECRET!,
        {
          expiresIn: '60m'
        }
      )

      expect({
        accessToken: data.accessToken,
        email: data.user.email
      }).toMatchObject({ accessToken: accessToken, email: input.email })
    })

    it("should show 'User not found'", async () => {
      let input: RegisterNewDeviceInput = {
        email: faker.internet.email(),
        deviceName: faker.internet.userName(),
        deviceId: faker.datatype.uuid(),
        firebaseToken: faker.datatype.uuid(),
        addDeviceSecret: faker.datatype.string(5),
        addDeviceSecretEncrypted: faker.datatype.string(5)
      }

      expect(async () => {
        await resolver.addNewDeviceForUser(
          input,
          input.addDeviceSecret,
          fakeCtx
        )
      }).rejects.toThrow('User not found')
    })

    it("should show 'Wrong master password used'", async () => {
      let userId = faker.datatype.uuid()

      let input: RegisterNewDeviceInput = {
        email: faker.internet.email(),
        deviceName: faker.internet.userName(),
        deviceId: faker.datatype.uuid(),
        firebaseToken: faker.datatype.uuid(),
        addDeviceSecret: faker.datatype.string(5),
        addDeviceSecretEncrypted: faker.datatype.string(5)
      }

      await prismaClient.user.create({
        data: {
          id: userId,
          email: input.email,
          addDeviceSecret: faker.datatype.string(5),
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          loginCredentialsLimit: 50,
          TOTPlimit: 4
        }
      })

      expect(async () => {
        await resolver.addNewDeviceForUser(
          input,
          input.addDeviceSecret,
          fakeCtx
        )
      }).rejects.toThrow('Wrong master password used')
    })
  })

  describe('deviceDecryptionChallenge', () => {
    it('should returns a decryption challenge', async () => {
      let userId = faker.datatype.uuid()
      let fakeData: RegisterNewDeviceInput = {
        email: faker.internet.email(),
        deviceName: faker.internet.userName(),
        deviceId: faker.datatype.uuid(),
        firebaseToken: faker.datatype.uuid(),
        addDeviceSecret: faker.datatype.string(5),
        addDeviceSecretEncrypted: faker.datatype.string(5)
      }
      await prismaClient.user.create({
        data: {
          id: userId,
          email: fakeData.email,
          addDeviceSecret: fakeData.addDeviceSecret,
          addDeviceSecretEncrypted: fakeData.addDeviceSecretEncrypted,
          loginCredentialsLimit: 50,
          TOTPlimit: 4
        }
      })

      let data = await resolver.deviceDecryptionChallenge(fakeData.email, {
        reply: { setCookie: jest.fn() },
        request: { headers: {} },
        jwtPayload: { userId: userId },
        getIpAddress: () => faker.internet.ip()
      } as any)

      expect(data?.addDeviceSecretEncrypted).toBe(
        fakeData.addDeviceSecretEncrypted
      )
    })

    it("should show 'Too many decryption challenges, wait for cooldown'", async () => {
      let userId = faker.datatype.uuid()

      let fakeData: RegisterNewDeviceInput = {
        email: faker.internet.email(),
        deviceName: faker.internet.userName(),
        deviceId: faker.datatype.uuid(),
        firebaseToken: faker.datatype.uuid(),
        addDeviceSecret: faker.datatype.string(5),
        addDeviceSecretEncrypted: faker.datatype.string(5)
      }
      await prismaClient.user.create({
        data: {
          id: userId,
          email: fakeData.email,
          addDeviceSecret: fakeData.addDeviceSecret,
          addDeviceSecretEncrypted: fakeData.addDeviceSecretEncrypted,
          loginCredentialsLimit: 50,
          TOTPlimit: 4
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

      expect(async () => {
        await resolver.deviceDecryptionChallenge(fakeData.email, {
          reply: { setCookie: jest.fn() },
          request: { headers: {} },
          jwtPayload: { userId: userId },
          getIpAddress: () => faker.internet.ip()
        } as any)
      }).rejects.toThrow('Too many decryption challenges, wait for cooldown')
    })
  })
})
