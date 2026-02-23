import { log } from 'console'

import { db } from '../prisma/prismaClient'
import { sendEmail } from '../utils/email'

type Notification = {
  title?: string
  body?: string
}

type AndroidConfig = {
  priority?: string
} & Record<string, unknown>

type ApnsPayload = {
  aps?: Record<string, unknown>
} & Record<string, unknown>

type ApnsConfig = {
  headers?: Record<string, string>
  payload?: ApnsPayload
} & Record<string, unknown>

export interface Message {
  token: string
  notification?: Notification
  data?: Record<string, string>
  android?: AndroidConfig
  apns?: ApnsConfig
}

export type FirebaseSendNotificationResult =
  | { ok: true }
  | { ok: false; reason: 'UNREGISTERED' }

type GoogleAccessTokenResponse = {
  access_token: string
  expires_in: number
}

type AccessTokenCache = {
  token: string
  expiresAtMs: number
  projectId: string
}

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const FIREBASE_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'
const TOKEN_EXPIRY_SKEW_MS = 60_000

let accessTokenCache: AccessTokenCache | null = null

const textEncoder = new TextEncoder()

const toBase64Url = (input: Uint8Array) => {
  let binary = ''

  for (const byte of input) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

const jsonToBase64Url = (value: unknown) =>
  toBase64Url(textEncoder.encode(JSON.stringify(value)))

const pemPrivateKeyToPkcs8Bytes = (pem: string) => {
  const normalized = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')

  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

const createGoogleServiceAccountAssertion = async () => {
  const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } =
    process.env as {
      FIREBASE_PROJECT_ID?: string
      FIREBASE_PRIVATE_KEY?: string
      FIREBASE_CLIENT_EMAIL?: string
    }

  if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    throw new Error('Missing Firebase service account credentials')
  }

  const privateKeyPem = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  const privateKeyBytes = pemPrivateKeyToPkcs8Bytes(privateKeyPem)

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )

  const nowSeconds = Math.floor(Date.now() / 1000)
  const expiresAtSeconds = nowSeconds + 3600

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const claims = {
    iss: FIREBASE_CLIENT_EMAIL,
    sub: FIREBASE_CLIENT_EMAIL,
    aud: GOOGLE_OAUTH_TOKEN_URL,
    scope: FIREBASE_SCOPE,
    iat: nowSeconds,
    exp: expiresAtSeconds
  }

  const unsignedJwt = `${jsonToBase64Url(header)}.${jsonToBase64Url(claims)}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    textEncoder.encode(unsignedJwt)
  )

  return {
    assertion: `${unsignedJwt}.${toBase64Url(new Uint8Array(signature))}`,
    projectId: FIREBASE_PROJECT_ID,
    expiresAtSeconds
  }
}

const getFirebaseAccessToken = async () => {
  if (
    accessTokenCache &&
    accessTokenCache.expiresAtMs > Date.now() + TOKEN_EXPIRY_SKEW_MS
  ) {
    return accessTokenCache
  }

  const { assertion, projectId } = await createGoogleServiceAccountAssertion()

  const tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  })

  const responseText = await tokenResponse.text()

  if (!tokenResponse.ok) {
    throw new Error(
      `Google OAuth token request failed (${tokenResponse.status}): ${responseText}`
    )
  }

  const parsed = JSON.parse(responseText) as GoogleAccessTokenResponse

  accessTokenCache = {
    token: parsed.access_token,
    expiresAtMs: Date.now() + parsed.expires_in * 1000,
    projectId
  }

  return accessTokenCache
}

const normalizeAndroidConfig = (android?: AndroidConfig) => {
  if (!android) return undefined

  if (typeof android.priority !== 'string') {
    return android
  }

  return {
    ...android,
    priority: android.priority.toUpperCase()
  }
}

const normalizeApnsConfig = (apns?: ApnsConfig) => {
  if (!apns?.payload?.aps) return apns

  if (
    !Object.prototype.hasOwnProperty.call(apns.payload.aps, 'contentAvailable')
  ) {
    return apns
  }

  const aps = apns.payload.aps as Record<string, unknown> & {
    contentAvailable?: unknown
  }
  const { contentAvailable, ...restAps } = aps

  const normalizedAps = contentAvailable
    ? { ...restAps, 'content-available': 1 }
    : restAps

  return {
    ...apns,
    payload: {
      ...apns.payload,
      aps: normalizedAps
    }
  }
}

const sendFcmHttpV1Message = async (msg: Message) => {
  const { token, projectId } = await getFirebaseAccessToken()

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          token: msg.token,
          notification: msg.notification,
          data: msg.data,
          android: normalizeAndroidConfig(msg.android),
          apns: normalizeApnsConfig(msg.apns)
        }
      })
    }
  )

  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(responseText)
  }

  return responseText
}

const isFcmUnregisteredTokenError = (errorMessage: string) => {
  return (
    errorMessage.includes('Requested entity was not found') ||
    errorMessage.includes('"message": "NotRegistered"') ||
    errorMessage.includes('"errorCode": "UNREGISTERED"')
  )
}

export async function firebaseSendNotification(msg: Message) {
  try {
    await sendFcmHttpV1Message(msg)
    return { ok: true } satisfies FirebaseSendNotificationResult
  } catch (err) {
    if (
      err instanceof Error &&
      isFcmUnregisteredTokenError(err.message) &&
      'token' in msg
    ) {
      log('firebase token is unregistered')

      const msgToken = (msg as { token: string }).token

      const device = await db.query.device.findFirst({
        where: { firebaseToken: msgToken }
      })

      if (!device) {
        log(`Device not found for firebase token ${msgToken}`)
        return {
          ok: false,
          reason: 'UNREGISTERED'
        } satisfies FirebaseSendNotificationResult
      }

      const user = await db.query.user.findFirst({
        where: { masterDeviceId: device.id }
      })

      if (!user) {
        log(`No master-device user found for firebase token ${msgToken}`)
        return {
          ok: false,
          reason: 'UNREGISTERED'
        } satisfies FirebaseSendNotificationResult
      }

      if (user.email) {
        await sendEmail(user.email, {
          Subject: 'Master device change required',
          TextPart: 'Your device has been deleted',
          HTMLPart: `<p>Your device ${device.name} is no longer reachable via firebase cloud messaging. 
          You need to make another device your master device. To confirm making your latest device your master device, please click <a href="${process.env.FRONTEND_URL}/confirm-master-device?token=${device.id}">here</a></p>`
        })
      }
      return {
        ok: false,
        reason: 'UNREGISTERED'
      } satisfies FirebaseSendNotificationResult
    } else {
      throw err
    }
  }
}
