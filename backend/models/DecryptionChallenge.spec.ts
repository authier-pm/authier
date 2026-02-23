import { db } from '../prisma/prismaClient'

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
import type { InferSelectModel } from 'drizzle-orm'
import * as schema from '../drizzle/schema'
import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { defaultDeviceSettingSystemValues } from './defaultDeviceSettingSystemValues'

type User = InferSelectModel<typeof schema.user>

const userSecurityProps = {
  deviceRecoveryCooldownMinutes: 960,
  loginCredentialsLimit: 50,
  totPlimit: 4
}

describe('DecryptionChallenge', () => {
  let user: User

  const challenge: DecryptionChallengeApproved =
    new DecryptionChallengeApproved()
  challenge.deviceId = crypto.randomUUID()
  challenge.deviceName = faker.lorem.word()
  const userId = crypto.randomUUID()
  const input: RegisterNewAccountInput = makeRegisterAccountInput()

  beforeAll(async () => {
    const [insertedUser] = await db
      .insert(schema.user)
      .values({
        id: userId,
        email: input.email,
        addDeviceSecret: input.addDeviceSecret,
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
        encryptionSalt: input.encryptionSalt,
        loginCredentialsLimit: 50,
        totPlimit: 4,
        deviceRecoveryCooldownMinutes: 960
      })
      .returning()
    user = insertedUser
  })

  describe('addNewDeviceForUser', () => {
    const fakeCtx = {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      reply: { setCookie: () => {} },
      request: { headers: {} },
      db,
      jwtPayload: { userId: userId },
      getIpAddress: () => faker.internet.ip()
    } as unknown as Parameters<
      DecryptionChallengeApproved['addNewDeviceForUser']
    >[2]
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
      challenge.userId = crypto.randomUUID()
      await expect(async () => {
        await challenge.addNewDeviceForUser(
          input,
          input.addDeviceSecret,
          fakeCtx
        )
      }).rejects.toThrow('User not found')
    })

    it("should show 'Wrong master password used'", async () => {
      const userId = crypto.randomUUID()

      const input = makeAddNewDeviceInput()
      challenge.userId = userId

      await db.insert(schema.user).values({
        id: userId,
        email: input.email,
        addDeviceSecret: faker.string.sample(5),
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
        encryptionSalt: faker.string.sample(5),
        ...userSecurityProps
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
    const slaveDeviceId = crypto.randomUUID()
    const masterDeviceId = crypto.randomUUID()
    const userId = crypto.randomUUID()

    const createUserData = async () => {
      const input: RegisterNewAccountInput = makeRegisterAccountInput()

      await db.insert(schema.user).values({
        id: userId,
        email: input.email,
        addDeviceSecret: faker.string.sample(5),
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
        encryptionSalt: faker.string.sample(5),
        newDevicePolicy: 'REQUIRE_MASTER_DEVICE_APPROVAL',
        ...userSecurityProps
      })

      await db.insert(schema.device).values({
        id: masterDeviceId,
        name: faker.lorem.word(),
        firebaseToken: crypto.randomUUID(),
        firstIpAddress: faker.internet.ip(),
        lastIpAddress: faker.internet.ip(),
        platform: faker.lorem.word(),
        userId,
        ...defaultDeviceSettingSystemValues
      })

      await db
        .update(schema.user)
        .set({
          masterDeviceId
        })
        .where(eq(schema.user.id, userId))

      await db.insert(schema.decryptionChallenge).values({
        id: challengeMutation.id,
        userId,
        deviceId: slaveDeviceId,
        deviceName: faker.lorem.word(),
        ipAddress: faker.internet.ip()
      })
    }
    it('should approve challenge', async () => {
      const fakeCtx = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        reply: { setCookie: () => {} },
        request: { headers: {} },
        db,
        jwtPayload: { userId: userId },
        getIpAddress: () => faker.internet.ip(),
        device: { id: masterDeviceId }
      } as unknown as Parameters<DecryptionChallengeMutation['approve']>[0]

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

      await db.delete(schema.user).where(eq(schema.user.id, userId))
    })

    it("should show 'Only the master device can approve a decryption challenge'", async () => {
      challengeMutation.id = faker.number.int({ min: 1, max: 1000 })

      const fakeCtx = {
        reply: { setCookie: () => {} },
        request: { headers: {} },
        db,
        jwtPayload: { userId: userId },
        getIpAddress: () => faker.internet.ip(),
        //NOTE: Change ID to be different from masterDeviceId
        device: { id: crypto.randomUUID() }
      } as unknown as Parameters<DecryptionChallengeMutation['approve']>[0]

      await createUserData()

      await expect(
        async () => await challengeMutation.approve(fakeCtx)
      ).rejects.toThrow(
        'Only the master device can approve a decryption challenge'
      )

      await db
        .delete(schema.decryptionChallenge)
        .where(eq(schema.decryptionChallenge.userId, userId))
      await db.delete(schema.device).where(eq(schema.device.userId, userId))
      await db.delete(schema.user).where(eq(schema.user.id, userId))
    })
  })
})
