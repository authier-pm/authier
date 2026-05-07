import { plainToClass } from 'class-transformer'
import { eq } from 'drizzle-orm'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { db } from '../prisma/prismaClient'
import { RedisBasicRateLimiter } from '../lib/RedisBasicRateLimiter'
import * as schema from '../drizzle/schema'
import {
  defaultAccountLimits,
  webInputRemovalMinimumAccountAgeMs
} from './accountLimits'
import { WebInputMutation } from './WebInput'

const insertedUserIds: string[] = []
const insertedWebInputIds: number[] = []

const insertUser = async (
  overrides: Partial<typeof schema.user.$inferInsert> = {}
) => {
  const [user] = await db
    .insert(schema.user)
    .values({
      id: crypto.randomUUID(),
      email: `${crypto.randomUUID()}@test.com`,
      addDeviceSecret: crypto.randomUUID(),
      addDeviceSecretEncrypted: crypto.randomUUID(),
      encryptionSalt: crypto.randomUUID(),
      deviceRecoveryCooldownMinutes: 960,
      ...defaultAccountLimits,
      ...overrides
    })
    .returning()

  insertedUserIds.push(user.id)

  return user
}

const insertWebInput = async (addedByUserId: string | null) => {
  const [input] = await db
    .insert(schema.webInput)
    .values({
      url: `https://${crypto.randomUUID()}.example.com/login`,
      kind: 'USERNAME',
      domPath: `#${crypto.randomUUID()}`,
      host: 'example.com',
      addedByUserId
    })
    .returning()

  insertedWebInputIds.push(input.id)

  return plainToClass(WebInputMutation, input)
}

const makeCtx = (userId: string) =>
  ({
    db,
    jwtPayload: { userId }
  }) as Parameters<WebInputMutation['delete']>[0]

describe('WebInputMutation', () => {
  afterEach(async () => {
    vi.restoreAllMocks()

    for (const id of insertedWebInputIds.splice(0)) {
      await db.delete(schema.webInput).where(eq(schema.webInput.id, id))
    }

    for (const id of insertedUserIds.splice(0)) {
      await db.delete(schema.user).where(eq(schema.user.id, id))
    }
  })

  it('prohibits removing web inputs from accounts newer than one week', async () => {
    const user = await insertUser()
    const input = await insertWebInput(null)

    await expect(input.delete(makeCtx(user.id))).rejects.toThrow(
      'You can remove saved autofill inputs after your account is at least 1 week old.'
    )
  })

  it('rate limits default-limit users removing web inputs added by others', async () => {
    const user = await insertUser({
      createdAt: new Date(Date.now() - webInputRemovalMinimumAccountAgeMs)
    })
    const input = await insertWebInput(null)
    const increment = vi
      .spyOn(RedisBasicRateLimiter.prototype, 'increment')
      .mockResolvedValue(undefined)

    await input.delete(makeCtx(user.id))

    expect(increment).toHaveBeenCalledWith(user.id)
  })

  it('does not rate limit users with higher than default account limits', async () => {
    const user = await insertUser({
      createdAt: new Date(Date.now() - webInputRemovalMinimumAccountAgeMs),
      loginCredentialsLimit: defaultAccountLimits.loginCredentialsLimit + 1
    })
    const input = await insertWebInput(null)
    const increment = vi
      .spyOn(RedisBasicRateLimiter.prototype, 'increment')
      .mockResolvedValue(undefined)

    await input.delete(makeCtx(user.id))

    expect(increment).not.toHaveBeenCalled()
    const deleted = await db.query.webInput.findFirst({
      where: { id: input.id }
    })
    expect(deleted).toBeUndefined()
  })

  it('does not rate limit users removing their own web inputs', async () => {
    const user = await insertUser({
      createdAt: new Date(Date.now() - webInputRemovalMinimumAccountAgeMs)
    })
    const input = await insertWebInput(user.id)
    const increment = vi
      .spyOn(RedisBasicRateLimiter.prototype, 'increment')
      .mockResolvedValue(undefined)

    await input.delete(makeCtx(user.id))

    expect(increment).not.toHaveBeenCalled()
  })
})
