import { z } from 'zod'
import {
  base64ToBuffer,
  decryptString,
  encryptString,
  generateEncryptionKey,
  initLocalDeviceAuthSecret
} from '@shared/cryptoUtils'
import { loginCredentialsSchema } from '@shared/loginCredentialsSchema'
import {
  authenticatedSessionSchema,
  mobileSecretRecordSchema,
  requestDeviceChallengeResultSchema,
  vaultSyncResultSchema,
  type MobileSecretRecord
} from '@shared/orpc/schemas'

const baseUrl = new URL(
  process.env.AUTHIER_SMOKE_BASE_URL ?? 'http://127.0.0.1:5052/api/v1/'
)
if (!['127.0.0.1', 'localhost', '[::1]'].includes(baseUrl.hostname)) {
  throw new Error('Compatibility smoke is restricted to a local ephemeral API')
}
const email = process.env.AUTHIER_SMOKE_EMAIL
const password = process.env.AUTHIER_SMOKE_PASSWORD
if (!email || !password)
  throw new Error(
    'Set AUTHIER_SMOKE_EMAIL and AUTHIER_SMOKE_PASSWORD for the synthetic native account'
  )

const post = async <T>(
  path: string,
  input: unknown,
  output: z.ZodType<T>,
  token?: string
): Promise<T> => {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(input)
  })
  if (!response.ok)
    throw new Error(`Local ${path} returned HTTP ${response.status}`)
  return output.parse(await response.json())
}

const device = {
  id: process.env.AUTHIER_SMOKE_DEVICE_ID ?? '00000000-0000-4000-8000-000000005052',
  name: 'TypeScript compatibility smoke',
  platform: 'web'
}
const challenge = await post(
  'auth/requestDeviceChallenge',
  { email, deviceInput: device },
  requestDeviceChallengeResultSchema
)
if (challenge.status !== 'approved') {
  console.log(
    JSON.stringify({
      status: 'awaiting-device-approval',
      challengeId: challenge.challengeId,
      deviceName: device.name
    })
  )
  process.exit(2)
}
const salt = base64ToBuffer(challenge.encryptionSalt)
const masterKey = await generateEncryptionKey(password, salt)
const currentAddDeviceSecret = await decryptString(
  masterKey,
  challenge.addDeviceSecretEncrypted
)
const nextDeviceSecrets = await initLocalDeviceAuthSecret(masterKey, salt)
const session = await post(
  'auth/completeDeviceLogin',
  {
    challengeId: challenge.challengeId,
    currentAddDeviceSecret,
    input: {
      ...nextDeviceSecrets,
      encryptionSalt: challenge.encryptionSalt,
      firebaseToken: null,
      devicePlatform: device.platform
    }
  },
  authenticatedSessionSchema
)

let cursor: string | undefined
let hasMore = true
const records = new Map<string, MobileSecretRecord>()
while (hasMore) {
  const page = await post(
    'vault/sync',
    { ...(cursor ? { cursor } : {}), limit: 100 },
    vaultSyncResultSchema,
    session.accessToken
  )
  for (const { secret } of page.changes) {
    const current = records.get(secret.id)
    if (!current || current.version <= secret.version)
      records.set(secret.id, secret)
  }
  cursor = page.nextCursor
  hasMore = page.hasMore
}

const expectedLabel =
  process.env.AUTHIER_SMOKE_EXPECT_LABEL ?? 'Native smoke login'
const expectedUsername =
  process.env.AUTHIER_SMOKE_EXPECT_USERNAME ?? 'autofill-demo'
const expectedPassword =
  process.env.AUTHIER_SMOKE_EXPECT_PASSWORD ?? 'autofill-demo-password'
const expectedUrl = process.env.AUTHIER_SMOKE_EXPECT_URL
let nativeItem: { id: string; label: string; version: number; urlMatches: boolean } | undefined
for (const record of records.values()) {
  if (record.deletedAt || record.kind !== 'LOGIN_CREDENTIALS') continue
  const content = loginCredentialsSchema.parse(
    JSON.parse(await decryptString(masterKey, record.encrypted))
  )
  if (content.label !== expectedLabel) continue
  if (
    content.username !== expectedUsername ||
    content.password !== expectedPassword
  ) {
    throw new Error(
      'Native item decrypted but did not match the synthetic fixture'
    )
  }
  if (expectedUrl && content.url !== expectedUrl) throw new Error('Native item URL did not match the synthetic fixture')
  nativeItem = { id: record.id, label: content.label, version: record.version, urlMatches: !expectedUrl || content.url === expectedUrl }
}
if (!nativeItem) throw new Error('Expected native-created item was not found')

const content = loginCredentialsSchema.parse({
  label: 'TypeScript smoke login',
  url: 'https://typescript.example.test',
  username: 'typescript-demo',
  password: 'typescript-demo-password',
  iconUrl: null,
  androidUri: 'dev.authier.autofillfixture',
  iosUri: null
})
const mutation = {
  operationId: crypto.randomUUID(),
  id: crypto.randomUUID(),
  kind: 'LOGIN_CREDENTIALS',
  encrypted: await encryptString(masterKey, JSON.stringify(content), salt)
}
const created = await post(
  'vault/create',
  mutation,
  mobileSecretRecordSchema,
  session.accessToken
)
const roundTrip = loginCredentialsSchema.parse(
  JSON.parse(await decryptString(masterKey, created.encrypted))
)
if (roundTrip.password !== content.password)
  throw new Error('TypeScript write round-trip did not match')
console.log(
  JSON.stringify(
    {
      status: 'passed',
      authenticatedDevice: device.name,
      nativeToTypeScript: {
        ...nativeItem,
        usernameMatches: true,
        passwordMatches: true
      },
      typeScriptToNative: {
        id: created.id,
        label: content.label,
        username: content.username,
        version: created.version
      },
      requestContainedCiphertextOnly: true
    },
    null,
    2
  )
)
