import { prismaClient } from '../prisma/prismaClient'

import { faker } from '@faker-js/faker'
import type {
  AddNewDeviceInput,
  RegisterNewAccountInput
} from '../models/AuthInputs'

import {
  makeAddNewDeviceInput,
  makeRegisterAccountInput
} from '../schemas/__test__/makeRegisterAccountInput'

import {
  DecryptionChallengeApproved,
  DecryptionChallengeMutation
} from './DecryptionChallenge'
import type { User } from '@prisma/client'
import { beforeAll, describe, expect, it } from 'vitest'
import { defaultDeviceSettingSystemValues } from './defaultDeviceSettingSystemValues'

const userSecurityProps = {
  deviceRecoveryCooldownMinutes: 960,
  loginCredentialsLimit: 50,
  TOTPlimit: 4
}

describe('DecryptionChallenge', () => {
  let user: User

  const challenge: DecryptionChallengeApproved =
    new DecryptionChallengeApproved()
  challenge.deviceId = faker.string.uuid()
  challenge.deviceName = faker.lorem.word()
  const userId = faker.string.uuid()
  const input: RegisterNewAccountInput = makeRegisterAccountInput()

  beforeAll(async () => {
    user = await prismaClient.user.create({
      data: {
        id: userId,
        email: input.email,
        addDeviceSecret: input.addDeviceSecret,
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
        encryptionSalt: input.encryptionSalt,
        loginCredentialsLimit: 50,
        TOTPlimit: 4,
        deviceRecoveryCooldownMinutes: 960
      }
    })
  })

  describe('addNewDeviceForUser', () => {
    const fakeCtx = {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      reply: { setCookie: () => {} },
      request: { headers: {} },
      prisma: prismaClient,
      jwtPayload: { userId: userId },
      getIpAddress: () => faker.internet.ip()
    } as any
    it('should add new device for user', async () => {
      challenge.userId = user.id
      const data = await challenge.addNewDeviceForUser(
        {
          ...input
        },
        input.addDeviceSecret,
        fakeCtx
      )

      expect({
        accessToken: data.accessToken,
        email: data.user.email
      }).toMatchObject({ accessToken: expect.any(String), email: input.email })
    })

    it("should show 'User not found'", async () => {
      const input: AddNewDeviceInput = makeAddNewDeviceInput()
      challenge.userId = faker.string.uuid()
      await expect(async () => {
        await challenge.addNewDeviceForUser(
          input,
          input.addDeviceSecret,
          fakeCtx
        )
      }).rejects.toThrow('User not found')
    })

    it("should show 'Wrong master password used'", async () => {
      const userId = faker.string.uuid()

      const input = makeAddNewDeviceInput()
      challenge.userId = userId

      await prismaClient.user.create({
        data: {
          id: userId,
          email: input.email,
          addDeviceSecret: faker.string.sample(5),
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          encryptionSalt: faker.string.sample(5),
          ...userSecurityProps
        }
      })

      expect(async () => {
        await challenge.addNewDeviceForUser(
          input,
          input.addDeviceSecret,
          fakeCtx
        )
      }).rejects.toThrow('Wrong master password used')
    })
  })

  describe('approve', async () => {
    const challengeMutation: DecryptionChallengeMutation =
      new DecryptionChallengeMutation()
    challengeMutation.id = faker.number.int({ min: 1, max: 1000 })
    challengeMutation.blockIp = false
    const slaveDeviceId = faker.string.uuid()
    const masterDeviceId = faker.string.uuid()
    const userId = faker.string.uuid()

    const createUserData = async () => {
      const input: RegisterNewAccountInput = makeRegisterAccountInput()

      await prismaClient.user.create({
        data: {
          id: userId,
          email: input.email,
          addDeviceSecret: faker.string.sample(5),
          addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
          encryptionSalt: faker.string.sample(5),
          ...userSecurityProps
        }
      })

      await prismaClient.device.create({
        data: {
          id: masterDeviceId,
          name: faker.lorem.word(),
          firebaseToken: faker.string.sample(5),
          firstIpAddress: faker.internet.ip(),
          lastIpAddress: faker.internet.ip(),
          platform: faker.lorem.word(),
          userId,
          ...defaultDeviceSettingSystemValues
        }
      })

      await prismaClient.user.update({
        where: { id: userId },
        data: {
          masterDeviceId
        }
      })

      await prismaClient.decryptionChallenge.create({
        data: {
          id: challengeMutation.id,
          userId,
          deviceId: slaveDeviceId,
          deviceName: faker.lorem.word(),
          ipAddress: faker.internet.ip()
        }
      })
    }
    it('should approve challenge', async () => {
      const fakeCtx = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        reply: { setCookie: () => {} },
        request: { headers: {} },
        prisma: prismaClient,
        jwtPayload: { userId: userId },
        getIpAddress: () => faker.internet.ip(),
        device: { id: masterDeviceId }
      } as any

      await createUserData()

      expect(await challengeMutation.approve(fakeCtx)).toMatchObject({
        approvedAt: expect.any(Date),
        rejectedAt: null,
        blockIp: null,
        deviceId: slaveDeviceId,
        userId,
        createdAt: expect.any(Date),
        ipAddress: expect.any(String),
        id: expect.any(Number)
      })

      await prismaClient.user.deleteMany()
    })

    it("should show 'Only the master device can approve a decryption chllenge'", async () => {
      challengeMutation.id = faker.number.int({ min: 1, max: 1000 })

      const fakeCtx = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        reply: { setCookie: () => {} },
        request: { headers: {} },
        prisma: prismaClient,
        jwtPayload: { userId: userId },
        getIpAddress: () => faker.internet.ip(),
        //NOTE: Change ID to be different from masterDeviceId
        device: { id: faker.string.uuid() }
      } as any

      await createUserData()

      await expect(
        async () => await challengeMutation.approve(fakeCtx)
      ).rejects.toThrow(
        'Only the master device can approve a decryption challenge'
      )

      await prismaClient.decryptionChallenge.deleteMany()
      await prismaClient.device.deleteMany()
      await prismaClient.user.deleteMany()
    })
  })
})
