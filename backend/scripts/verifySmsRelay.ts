import type { z } from 'zod'
import {
  base64ToBuffer,
  bufferToBase64,
  decryptString,
  generateEncryptionKey,
  initLocalDeviceAuthSecret
} from '@shared/cryptoUtils'
import {
  authenticatedSessionSchema,
  requestDeviceChallengeResultSchema
} from '@shared/orpc/schemas'
import { relayedCodePayloadSchema } from '@shared/relayedVerificationCode'

// Acts as a browser device on the local smoke API: registers the synthetic account
// (or signs in to it), then prints each code an Android phone relays, decrypted.
const origin = new URL(
  process.env.AUTHIER_SMOKE_ORIGIN ?? 'http://127.0.0.1:5052/'
)
if (!['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)) {
  throw new Error('SMS relay smoke is restricted to a local ephemeral API')
}
const email = process.env.AUTHIER_SMOKE_EMAIL
const password = process.env.AUTHIER_SMOKE_PASSWORD
const expectedCode = process.env.AUTHIER_SMOKE_EXPECT_CODE
const timeoutMs = Number(process.env.AUTHIER_SMOKE_TIMEOUT_MS ?? 600_000)
if (!email || !password)
  throw new Error('Set AUTHIER_SMOKE_EMAIL and AUTHIER_SMOKE_PASSWORD')

const post = async <T>(path: string, input: unknown, output: z.ZodType<T>) => {
  const response = await fetch(new URL(`api/v1/${path}`, origin), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  })
  if (!response.ok)
    throw new Error(`Local ${path} returned HTTP ${response.status}`)
  return output.parse(await response.json())
}

const device = {
  id: crypto.randomUUID(),
  name: 'SMS relay smoke browser',
  platform: 'web'
}
const challenge = await post(
  'auth/requestDeviceChallenge',
  { email, deviceInput: device },
  requestDeviceChallengeResultSchema
).catch(() => null)
const signIn = async () => {
  if (challenge?.status !== 'approved')
    throw new Error('Allow new devices without approval for this smoke account')
  const salt = base64ToBuffer(challenge.encryptionSalt)
  const masterKey = await generateEncryptionKey(password, salt)
  const session = await post(
    'auth/completeDeviceLogin',
    {
      challengeId: challenge.challengeId,
      currentAddDeviceSecret: await decryptString(
        masterKey,
        challenge.addDeviceSecretEncrypted
      ),
      input: {
        ...(await initLocalDeviceAuthSecret(masterKey, salt)),
        encryptionSalt: challenge.encryptionSalt,
        firebaseToken: null,
        devicePlatform: device.platform
      }
    },
    authenticatedSessionSchema
  )
  return { masterKey, accessToken: session.accessToken }
}
const register = async () => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const masterKey = await generateEncryptionKey(password, salt)
  const session = await post(
    'auth/register',
    {
      userId: crypto.randomUUID(),
      deviceId: device.id,
      deviceName: device.name,
      email,
      input: {
        ...(await initLocalDeviceAuthSecret(masterKey, salt)),
        encryptionSalt: bufferToBase64(salt),
        firebaseToken: null,
        devicePlatform: device.platform
      }
    },
    authenticatedSessionSchema
  )
  return { masterKey, accessToken: session.accessToken }
}
// An unknown email gets a pending challenge, so a new account must register.
const { masterKey, accessToken } =
  challenge?.status === 'approved' ? await signIn() : await register()
console.log(JSON.stringify({ status: 'watching', email, device: device.name }))

const seen = new Set<string>()
const deadline = Date.now() + timeoutMs
while (Date.now() < deadline) {
  const result = await fetch(new URL('graphql', origin), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      query:
        '{ me { relayedVerificationCodes { id encrypted expiresAt deviceName } } }'
    })
  }).then((graphql) => graphql.json())
  const relayed: Array<{
    id: string
    encrypted: string
    deviceName: string
    expiresAt: string
  }> = result.data.me.relayedVerificationCodes
  for (const code of relayed.filter(({ id }) => !seen.has(id))) {
    seen.add(code.id)
    const payload = relayedCodePayloadSchema.parse(
      JSON.parse(await decryptString(masterKey, code.encrypted))
    )
    console.log(
      JSON.stringify({
        status: 'relayed',
        code: payload.code,
        sender: payload.sender,
        deviceName: code.deviceName,
        secondsUntilExpiry: Math.round(
          (Date.parse(code.expiresAt) - Date.now()) / 1000
        )
      })
    )
    if (payload.code === expectedCode) {
      console.log(JSON.stringify({ status: 'passed' }))
      process.exit(0)
    }
  }
  await Bun.sleep(1000)
}
// Without an expected code, this is a watch window (e.g. while the phone is locked).
console.log(JSON.stringify({ status: expectedCode ? 'timed-out' : 'done' }))
process.exit(expectedCode ? 1 : 0)
