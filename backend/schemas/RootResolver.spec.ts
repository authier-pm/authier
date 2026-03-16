/* eslint-disable @typescript-eslint/no-empty-function */
import { db } from '../prisma/prismaClient'
import { RootResolver } from './RootResolver'
import type { IContextAuthenticated } from '../models/types/ContextTypes'
import { faker } from '@faker-js/faker'
import type { RegisterNewAccountInput } from '../models/AuthInputs'
import { describe, expect, it } from 'vitest'

import { makeFakeCtx } from '../tests/makeFakeCtx'
import type {
  DecryptionChallengeApproved,
  DecryptionChallengeForApproval
} from '../models/DecryptionChallenge'
import { WebInputTypeGQL } from '../models/types/WebInputType'
import { fakeUserAndContext } from './__test__/fakeUserAndContext'
import { makeRegisterAccountInput } from './__test__/makeRegisterAccountInput'
import { defaultDeviceSettingSystemValues } from 'models/defaultDeviceSettingSystemValues'
import type { GraphQLResolveInfo } from 'graphql'
import * as schema from '../drizzle/schema'
import { eq } from 'drizzle-orm'

const userSecurityProps = {
  deviceRecoveryCooldownMinutes: 960,
  loginCredentialsLimit: 50,
  TOTPlimit: 4
}

describe('RootResolver', () => {
  const resolver = new RootResolver()

  describe('me', () => {
    it('should return current user', async () => {
      const userId = crypto.randomUUID()
      const [user] = await db
        .insert(schema.user)
        .values({
          id: userId,
          email: `${crypto.randomUUID()}@test.com`,
          addDeviceSecret: faker.string.sample(5),
          addDeviceSecretEncrypted: faker.string.sample(5),
          encryptionSalt: faker.string.sample(5),
          ...userSecurityProps
        })
        .returning()

      expect(
        await resolver.me(
          {
            request: { headers: {} },
            db,
            jwtPayload: { userId: user.id }
          } as IContextAuthenticated,
          {} as GraphQLResolveInfo
        )
      ).toMatchObject(user)
    })
  })

  describe('registerNewUser', () => {
    const userId = crypto.randomUUID()

    it('should add new user', async () => {
      const input: RegisterNewAccountInput = makeRegisterAccountInput()

      const data = await resolver.registerNewUser(
        input,
        userId,
        makeFakeCtx({ userId })
      )

      expect({
        accessToken: data.accessToken,
        email: data.user.email
      }).toMatchObject({ accessToken: expect.any(String), email: input.email })

      await db.delete(schema.device).where(eq(schema.device.userId, userId))
      await db
        .delete(schema.decryptionChallenge)
        .where(eq(schema.decryptionChallenge.userId, userId))
      await db.delete(schema.user).where(eq(schema.user.id, userId))
    })

    it('should throw User with such email already exists', async () => {
      const input: RegisterNewAccountInput = makeRegisterAccountInput()
      const newUserId = crypto.randomUUID()
      await db.insert(schema.user).values({
        id: newUserId,
        email: input.email,
        addDeviceSecret: input.addDeviceSecret,
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
        encryptionSalt: input.encryptionSalt,
        ...userSecurityProps
      })

      await expect(
        async () =>
          await resolver.registerNewUser(input, userId, makeFakeCtx({ userId }))
      ).rejects.toThrow('User with such email already exists.')
    })

    it("should show 'Device already exists. You cannot register this device for multiple accounts.'", async () => {
      const userId = crypto.randomUUID()

      const input: RegisterNewAccountInput = makeRegisterAccountInput()
      await db.insert(schema.user).values({
        id: userId,
        email: `${crypto.randomUUID()}@test.com`,
        addDeviceSecret: input.addDeviceSecret,
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
        encryptionSalt: input.encryptionSalt,
        ...userSecurityProps
      })

      await db.insert(schema.device).values({
        id: input.deviceId,
        platform: 'iOS',
        firstIpAddress: faker.internet.ip(),
        lastIpAddress: faker.internet.ip(),
        firebaseToken: crypto.randomUUID(),
        name: input.deviceName,
        userId,
        ...defaultDeviceSettingSystemValues
      })

      await expect(
        async () =>
          await resolver.registerNewUser(
            input,
            crypto.randomUUID(),
            makeFakeCtx({ userId })
          )
      ).rejects.toThrow(
        `Device ${input.deviceId} already exists. You cannot use a device with multiple accounts.`
      )
    })
  })

  describe('deviceDecryptionChallenge', () => {
    it('should return a DecryptionChallengeForApproval', async () => {
      const userId = crypto.randomUUID()
      const fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
      await db.insert(schema.user).values({
        id: userId,
        email: fakeData.email,
        addDeviceSecret: fakeData.addDeviceSecret,
        addDeviceSecretEncrypted: fakeData.addDeviceSecretEncrypted,
        newDevicePolicy: 'REQUIRE_MASTER_DEVICE_APPROVAL',
        encryptionSalt: fakeData.encryptionSalt,
        ...userSecurityProps
      })

      // Insert a master device and set masterDeviceId on user so
      // userHasNoMasterDevice is false, otherwise the resolver
      // auto-approves and returns addDeviceSecretEncrypted
      const masterDeviceId = crypto.randomUUID()
      await db.insert(schema.device).values({
        id: masterDeviceId,
        platform: 'iOS',
        firstIpAddress: faker.internet.ip(),
        lastIpAddress: faker.internet.ip(),
        firebaseToken: crypto.randomUUID(),
        name: 'master device',
        userId,
        ...defaultDeviceSettingSystemValues
      })
      await db
        .update(schema.user)
        .set({ masterDeviceId })
        .where(eq(schema.user.id, userId))

      const data = (await resolver.deviceDecryptionChallenge(
        fakeData.email,
        {
          id: crypto.randomUUID(),
          name: 'chrome ',
          platform: 'macOS'
        },
        makeFakeCtx({ userId })
      )) as DecryptionChallengeForApproval

      expect(
        (data as { addDeviceSecretEncrypted?: string })
          ?.addDeviceSecretEncrypted
      ).toBe(undefined)
    })

    it("should show 'Too many decryption challenges, wait for cooldown'", async () => {
      const userId = crypto.randomUUID()

      const fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
      await db.insert(schema.user).values({
        id: userId,
        email: fakeData.email,
        addDeviceSecret: fakeData.addDeviceSecret,
        addDeviceSecretEncrypted: fakeData.addDeviceSecretEncrypted,
        encryptionSalt: fakeData.encryptionSalt,
        ...userSecurityProps
      })

      const data = Array.from({ length: 10 }).map(() => ({
        userId: userId,
        ipAddress: faker.internet.ip(),
        masterPasswordVerifiedAt: null,
        deviceId: crypto.randomUUID(),
        deviceName: 'chrome'
      }))

      await db.insert(schema.decryptionChallenge).values(data)

      await expect(async () => {
        await resolver.deviceDecryptionChallenge(
          fakeData.email,
          {
            id: crypto.randomUUID(),
            name: 'chrome ',
            platform: 'macOS'
          },
          makeFakeCtx({ userId })
        )
      }).rejects.toThrow('Too many decryption challenges, wait for cooldown')
    })

    it('should block creation of a challenge from an IP which was blocked previously', async () => {
      const userId = crypto.randomUUID()
      const blockedIp = faker.internet.ip()
      const fakeCtx = {
        reply: { setCookie: () => {} },
        request: { headers: {} },
        db,
        jwtPayload: { userId: userId },
        getIpAddress: () => blockedIp
      } as unknown as IContextAuthenticated

      const fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
      await db.insert(schema.user).values({
        id: userId,
        email: fakeData.email,
        addDeviceSecret: fakeData.addDeviceSecret,
        addDeviceSecretEncrypted: fakeData.addDeviceSecretEncrypted,
        encryptionSalt: fakeData.encryptionSalt,
        ...userSecurityProps
      })

      await db.insert(schema.decryptionChallenge).values({
        userId: userId,
        ipAddress: blockedIp,
        masterPasswordVerifiedAt: null,
        deviceId: crypto.randomUUID(),
        deviceName: 'chrome',
        blockIp: true
      })

      await expect(async () => {
        await resolver.deviceDecryptionChallenge(
          fakeData.email,
          {
            id: crypto.randomUUID(),
            name: 'chrome ',
            platform: 'macOS'
          },
          fakeCtx
        )
      }).rejects.toThrow('Login failed, try again later')
    })
  })

  describe('addWebInputs', () => {
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

      expect(inputs).toHaveLength(1) // TODO: flaky here, fix

      expect(inputs[0]).toMatchObject({
        domOrdinal: 0,
        domPath: 'body',
        host: 'google.com',
        kind: 'PASSWORD',
        url: 'https://google.com'
      })
    })
  })
})
