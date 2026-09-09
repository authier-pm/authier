import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { eq } from 'drizzle-orm'
import { classifyAndCachePasswordForm } from './classifyPasswordForm'
import { db, setDb } from '../prisma/prismaClient'
import { setupTestDb, testDb } from '../tests/testEnv'
import { user, webInput } from '../drizzle/schema'
import type {
  PasswordFormResult,
  PasswordFormSnapshot
} from '../../shared/passwordFormClassification'
import { RootResolver } from '../schemas/RootResolver'
import { makeFakeCtx } from '../tests/makeFakeCtx'
import { WebInputTypeGQL } from '../models/types/WebInputType'

const userId = crypto.randomUUID()
const snapshot: PasswordFormSnapshot = {
  url: 'https://www.kostkohratky.cz/1669325656/e-register-confirm',
  language: 'cs',
  html: '<form><h1>Zadejte nové heslo</h1><div>Nové heslo<input type="password" data-authier-index="0"></div><div>Nové heslo znovu<input type="password" data-authier-index="1"></div><button>Odeslat</button></form>',
  inputs: [
    {
      type: 'password',
      domPath: 'input[name="registerConfirm[newPassword]"]',
      domOrdinal: 0
    },
    {
      type: 'password',
      domPath: 'input[name="registerConfirm[newPasswordConfirm]"]',
      domOrdinal: 0
    }
  ]
}
const signupResult: PasswordFormResult = {
  kind: 'SIGNUP',
  currentPasswordIndex: null,
  newPasswordIndexes: [0, 1],
  usernameIndex: null
}
const fetchMock = vi.fn<typeof fetch>()
const modelResponse = (result: PasswordFormResult) =>
  Response.json({
    choices: [
      { finish_reason: 'stop', message: { content: JSON.stringify(result) } }
    ]
  })

describe('OpenRouter form classifications stored in webInputs', () => {
  let client: PGlite
  beforeAll(async () => {
    client = await setupTestDb()
    setDb(testDb)
    await db.insert(user).values({
      id: userId,
      email: 'classifier@example.com',
      addDeviceSecret: 'test',
      addDeviceSecretEncrypted: 'test',
      encryptionSalt: 'test',
      loginCredentialsLimit: 50,
      TOTPlimit: 4,
      deviceRecoveryCooldownMinutes: 960
    })
  })
  afterAll(async () => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    await client.close()
  })
  beforeEach(async () => {
    await db.delete(webInput)
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock
      .mockReset()
      .mockImplementation(async () => modelResponse(signupResult))
  })

  it('uses the free router once and reuses the database result across token changes', async () => {
    const first = await classifyAndCachePasswordForm(db, userId, {
      ...snapshot,
      url: `${snapshot.url}?token=secret#fragment`
    })
    const second = await classifyAndCachePasswordForm(db, userId, snapshot)
    expect(second).toEqual(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const request = fetchMock.mock.calls[0][1]
    const body = JSON.parse(String(request?.body))
    expect(body.model).toBe('openrouter/free')
    expect(body.response_format.type).toBe('json_schema')
    expect(JSON.stringify(body)).not.toContain('token=secret')
    expect(first?.url).toBe(snapshot.url)
    expect(first?.formClassification?.result).toEqual(signupResult)
    expect(await db.select().from(webInput)).toHaveLength(1)
  })

  it.each(['界'.repeat(8000), '\u0000'.repeat(4000)])(
    'rejects a payload over the serialized byte budget before calling OpenRouter',
    async (html) => {
      await expect(
        classifyAndCachePasswordForm(db, userId, { ...snapshot, html })
      ).rejects.toThrow('byte budget')
      expect(fetchMock).not.toHaveBeenCalled()
      expect(await db.select().from(webInput)).toHaveLength(0)
    }
  )

  it('refreshes a changed form and coalesces concurrent requests', async () => {
    await Promise.all([
      classifyAndCachePasswordForm(db, userId, snapshot),
      classifyAndCachePasswordForm(db, userId, snapshot)
    ])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const changed = {
      ...snapshot,
      html: snapshot.html.replace('Odeslat', 'Potvrdit')
    }
    await classifyAndCachePasswordForm(db, userId, changed)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(await db.select().from(webInput)).toHaveLength(1)
  })

  it('keeps the classification when a credential later saves its learned selector', async () => {
    const classified = await classifyAndCachePasswordForm(db, userId, snapshot)
    await new RootResolver().addWebInputs(
      [
        {
          url: snapshot.url,
          domPath: snapshot.inputs[0].domPath,
          domOrdinal: 0,
          kind: WebInputTypeGQL.PASSWORD
        }
      ],
      makeFakeCtx({ userId })
    )
    const [saved] = await db
      .select()
      .from(webInput)
      .where(eq(webInput.id, classified!.id))
    expect(saved.formClassification).toEqual(classified?.formClassification)
    await classifyAndCachePasswordForm(db, userId, snapshot)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    { ...signupResult, newPasswordIndexes: [0, 9] },
    { ...signupResult, currentPasswordIndex: 0 },
    { ...signupResult, newPasswordIndexes: [0, 0] },
    { ...signupResult, newPasswordIndexes: [0] }
  ])('rejects invalid model field assignments: %j', async (result) => {
    fetchMock.mockResolvedValue(modelResponse(result))
    await expect(
      classifyAndCachePasswordForm(db, userId, snapshot)
    ).rejects.toThrow()
    expect(await db.select().from(webInput)).toHaveLength(0)
  })

  it('caches UNKNOWN without inventing a password target', async () => {
    const unknownResult: PasswordFormResult = {
      kind: 'UNKNOWN',
      currentPasswordIndex: null,
      newPasswordIndexes: [],
      usernameIndex: null
    }
    fetchMock.mockResolvedValue(modelResponse(unknownResult))
    await classifyAndCachePasswordForm(db, userId, snapshot)
    const cached = await classifyAndCachePasswordForm(db, userId, snapshot)
    expect(cached?.formClassification?.result).toEqual(unknownResult)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not persist provider failures and can retry later', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }))
    await expect(
      classifyAndCachePasswordForm(db, userId, snapshot)
    ).rejects.toThrow('(429)')
    expect(await db.select().from(webInput)).toHaveLength(0)
    expect(
      await classifyAndCachePasswordForm(db, userId, snapshot)
    ).not.toBeNull()
  })
})
