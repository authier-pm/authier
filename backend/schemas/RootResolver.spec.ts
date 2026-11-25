import { hashDeviceSecret } from '../utils/deviceSecretHash'
import { sign } from 'jsonwebtoken'
import { db } from '../prisma/prismaClient'
import { RootResolver } from './RootResolver'
import type { IContextAuthenticated } from '../models/types/ContextTypes'
import { faker } from '@faker-js/faker'
import type { RegisterNewAccountInput } from '../models/AuthInputs'
import { describe, expect, it } from 'vitest'

import { makeFakeCtx } from '../tests/makeFakeCtx'
import { DecryptionChallengeForApproval } from '../models/DecryptionChallenge'
import { WebInputTypeGQL } from '../models/types/WebInputType'
import { fakeUserAndContext } from './__test__/fakeUserAndContext'
import { makeRegisterAccountInput } from './__test__/makeRegisterAccountInput'
import { defaultDeviceSettingSystemValues } from '../models/defaultDeviceSettingSystemValues'
import { graphql, type GraphQLResolveInfo } from 'graphql'
import { readFileSync } from 'node:fs'
import * as schema from '../drizzle/schema'
import { eq } from 'drizzle-orm'
import { gqlSchema } from './gqlSchema'

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

    it('returns the new master device through the extension signup mutation', async () => {
      const signupUserId = crypto.randomUUID()
      const deviceId = crypto.randomUUID()
      const input: RegisterNewAccountInput = {
        email: `${signupUserId}@example.com`,
        deviceId,
        deviceName: 'Test browser',
        devicePlatform: 'Linux',
        firebaseToken: null,
        addDeviceSecret: 'test-device-secret',
        addDeviceSecretEncrypted: 'test-encrypted-device-secret',
        encryptionSalt: 'test-salt'
      }
      const result = await graphql({
        schema: gqlSchema,
        source: readFileSync(
          new URL('../../shared/graphql/registerNewUser.gql', import.meta.url),
          'utf8'
        ),
        variableValues: { input, userId: signupUserId },
        contextValue: makeFakeCtx({ userId: signupUserId, deviceId })
      })

      expect(result.errors).toBeUndefined()
      expect(result.data).toEqual({
        registerNewUser: {
          accessToken: expect.any(String),
          user: {
            id: signupUserId,
            sendEmailVerification: 1,
            notificationOnVaultUnlock: false,
            notificationOnWrongPasswordAttempts: 3,
            Devices: [{ id: deviceId, name: input.deviceName }]
          }
        }
      })
      expect(
        await db.query.user.findFirst({
          where: { id: signupUserId },
          columns: { masterDeviceId: true }
        })
      ).toEqual({ masterDeviceId: deviceId })
    })

    it('should throw User with such email already exists', async () => {
      const input: RegisterNewAccountInput = makeRegisterAccountInput()
      const newUserId = crypto.randomUUID()
      await db.insert(schema.user).values({
        id: newUserId,
        email: input.email,
        addDeviceSecret: await hashDeviceSecret(input.addDeviceSecret),
        addDeviceSecretEncrypted: input.addDeviceSecretEncrypted,
        encryptionSalt: input.encryptionSalt,
        ...userSecurityProps
      })

      await expect(
        async () =>
          await resolver.registerNewUser(input, userId, makeFakeCtx({ userId }))
      ).rejects.toThrow('User with such email already exists.')
    })

    it('rejects a device already in use and rolls back the new account', async () => {
      const userId = crypto.randomUUID()
      const signupUserId = crypto.randomUUID()

      const input: RegisterNewAccountInput = makeRegisterAccountInput()
      await db.insert(schema.user).values({
        id: userId,
        email: `${crypto.randomUUID()}@test.com`,
        addDeviceSecret: await hashDeviceSecret(input.addDeviceSecret),
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
            signupUserId,
            makeFakeCtx({ userId: signupUserId })
          )
      ).rejects.toThrow(
        `Device ${input.deviceId} already exists. You cannot use a device with multiple accounts.`
      )
      expect(
        await db.query.user.findFirst({ where: { id: signupUserId } })
      ).toBeUndefined()
    })
  })

  describe('deviceDecryptionChallenge', () => {
    /**
     * A user who requires approval for new devices and owns exactly one device.
     * Its already-enrolled master may bootstrap its first login challenge.
     */
    const insertApprovalRequiringUser = async () => {
      const userId = crypto.randomUUID()
      const masterDeviceId = crypto.randomUUID()
      const fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
      await db.insert(schema.user).values({
        id: userId,
        email: fakeData.email,
        addDeviceSecret: await hashDeviceSecret(fakeData.addDeviceSecret),
        addDeviceSecretEncrypted: fakeData.addDeviceSecretEncrypted,
        newDevicePolicy: 'OTHER_DEVICE',
        encryptionSalt: fakeData.encryptionSalt,
        ...userSecurityProps
      })
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

      return { userId, masterDeviceId, email: fakeData.email }
    }

    it('should return a DecryptionChallengeForApproval', async () => {
      const { userId, email } = await insertApprovalRequiringUser()

      const data = await resolver.deviceDecryptionChallenge(
        email,
        {
          id: crypto.randomUUID(),
          name: 'chrome ',
          platform: 'macOS'
        },
        makeFakeCtx({ userId })
      )

      expect(data).toBeInstanceOf(DecryptionChallengeForApproval)
      expect(data).not.toHaveProperty('addDeviceSecretEncrypted')
    })

    it('withholds approval and verifier material from an unauthenticated request using the master device ID', async () => {
      const { userId, masterDeviceId, email } =
        await insertApprovalRequiringUser()

      const data = await resolver.deviceDecryptionChallenge(
        email,
        { id: masterDeviceId, name: 'master device', platform: 'iOS' },
        makeFakeCtx({ userId })
      )

      expect(data).toBeInstanceOf(DecryptionChallengeForApproval)
      expect(data).not.toHaveProperty('addDeviceSecretEncrypted')
      expect(data).not.toHaveProperty('encryptionSalt')
    })

    it('lets an authenticated master device create a password-change challenge without exposing verifier material unauthenticated', async () => {
      const { userId, masterDeviceId, email } =
        await insertApprovalRequiringUser()
      const token = sign(
        { userId, deviceId: masterDeviceId, tokenVersion: 0 },
        process.env.ACCESS_TOKEN_SECRET!
      )
      const authCtx = {
        ...makeFakeCtx({ userId, deviceId: masterDeviceId }),
        request: {
          headers: { authorization: `Bearer ${token}` },
          cookies: {}
        }
      }
      const authChallenge = await resolver.deviceDecryptionChallenge(
        email,
        { id: masterDeviceId, name: 'master device', platform: 'iOS' },
        authCtx
      )
      expect(authChallenge).toBeInstanceOf(DecryptionChallengeForApproval)
      expect(authChallenge).not.toHaveProperty('addDeviceSecretEncrypted')

      // An unauthenticated caller cannot reuse that challenge to obtain verifier material.
      const unauthResult = await resolver.deviceDecryptionChallenge(
        email,
        { id: masterDeviceId, name: 'master device', platform: 'iOS' },
        makeFakeCtx({ userId })
      )
      expect(unauthResult).toBeInstanceOf(DecryptionChallengeForApproval)
      expect(unauthResult).not.toHaveProperty('addDeviceSecretEncrypted')
      expect(unauthResult).not.toHaveProperty('encryptionSalt')
    })

    it('rejects a device registered to another account before creating a challenge', async () => {
      const victim = await insertApprovalRequiringUser()
      // Anyone can sign up, so an attacker always knows one valid device id.
      const attacker = await insertApprovalRequiringUser()

      await expect(
        resolver.deviceDecryptionChallenge(
          victim.email,
          { id: attacker.masterDeviceId, name: 'chrome', platform: 'macOS' },
          makeFakeCtx({ userId: attacker.userId })
        )
      ).rejects.toThrow('Login failed')
      const challenge = await db.query.decryptionChallenge.findFirst({
        where: { userId: victim.userId, deviceId: attacker.masterDeviceId }
      })
      expect(challenge).toBeUndefined()
    })

    it("should show 'Too many decryption challenges, wait for cooldown'", async () => {
      const userId = crypto.randomUUID()

      const fakeData: RegisterNewAccountInput = makeRegisterAccountInput()
      await db.insert(schema.user).values({
        id: userId,
        email: fakeData.email,
        addDeviceSecret: await hashDeviceSecret(fakeData.addDeviceSecret),
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
        addDeviceSecret: await hashDeviceSecret(fakeData.addDeviceSecret),
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
