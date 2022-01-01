import { prismaClient } from '../prismaClient'
import { RootResolver } from './RootResolver'
import faker, { fake } from 'faker'
import { RegisterNewDeviceInput } from '../models/AuthInputs'
import { setNewAccessTokenIntoCookie } from '../userAuth'
import { User } from '@prisma/client'
import { sign } from 'jsonwebtoken'

afterAll(async () => {
  const deleteDevices = prismaClient.device.deleteMany()
  const deleteSettings = prismaClient.settingsConfig.deleteMany()
  const deleteUsers = prismaClient.user.deleteMany()

  await prismaClient.$transaction([deleteDevices, deleteSettings, deleteUsers])

  await prismaClient.$disconnect()
})

describe('RootResolver', () => {
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

      const resolver = new RootResolver()
      expect(
        await resolver.me(
          {
            request: { headers: {} },
            jwtPayload: { userId: user.id }
          } as any,
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

      const resolver = new RootResolver()

      let data = await resolver.registerNewUser(input, userId, fakeCtx)

      expect({
        accessToken: data.accessToken,
        email: data.user.email
      }).toMatchObject({ accessToken: accessToken, email: input.email })
    })

    it("should show 'User with such email already exists.'", async () => {
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

      const resolver = new RootResolver()

      expect(
        async () =>
          await resolver.registerNewUser(input, userId, {
            reply: { setCookie: jest.fn() },
            request: { headers: {} },
            jwtPayload: { userId: userId },
            getIpAddress: () => faker.internet.ip()
          } as any)
      ).rejects.toThrow('User with such email already exists.')
    })
  })
})
