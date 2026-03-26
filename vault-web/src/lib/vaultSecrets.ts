import { decryptString, encryptString } from '@shared/cryptoUtils'
import { loginCredentialsSchema, totpSchema } from '@shared/loginCredentialsSchema'
import type { VaultApiOutputs } from '@shared/orpc/contract'
import { z } from 'zod'

type SecretRecord = VaultApiOutputs['session']['bootstrap']['secrets'][number]
type SecretPayload = Record<string, unknown>

export type LoginSecretValues = z.infer<typeof loginCredentialsSchema>
export type TotpSecretValues = z.infer<typeof totpSchema>

export type DecryptedVaultSecret =
  | (SecretRecord & {
      kind: 'LOGIN_CREDENTIALS'
      loginCredentials: LoginSecretValues
    })
  | (SecretRecord & {
      kind: 'TOTP'
      totp: TotpSecretValues
    })

export type DecryptSecretsResult = {
  secrets: DecryptedVaultSecret[]
  failedCount: number
}

const secretPayloadSchema = z.record(z.string(), z.unknown())

const readStringValue = (value: unknown) => (typeof value === 'string' ? value : '')

const readNullableStringValue = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  return value.length > 0 ? value : null
}

const readNullableUrlValue = (value: unknown) =>
  typeof value === 'string' ? value : null

const readNumberValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

const normalizeLoginSecret = (payload: SecretPayload): LoginSecretValues => {
  const url = readStringValue(payload.url)
  const username = readStringValue(payload.username)

  return {
    label: readStringValue(payload.label) || url || username || 'Untitled login',
    url,
    iconUrl: readNullableStringValue(payload.iconUrl),
    username,
    password: readStringValue(payload.password),
    androidUri: readNullableStringValue(payload.androidUri),
    iosUri: readNullableStringValue(payload.iosUri)
  }
}

const normalizeTotpSecret = (payload: SecretPayload): TotpSecretValues => {
  const url = readNullableUrlValue(payload.url)

  return {
    label:
      readStringValue(payload.label) ||
      readStringValue(payload.originalName) ||
      url ||
      'Untitled TOTP',
    url,
    iconUrl: readNullableStringValue(payload.iconUrl),
    secret: readStringValue(payload.secret),
    digits: readNumberValue(payload.digits) ?? 6,
    period: readNumberValue(payload.period) ?? 30,
    androidUri: readNullableStringValue(payload.androidUri),
    iosUri: readNullableStringValue(payload.iosUri)
  }
}

export const decryptSecretRecord = async (
  secret: SecretRecord,
  masterKey: CryptoKey
): Promise<DecryptedVaultSecret> => {
  const decrypted = await decryptString(masterKey, secret.encrypted)
  const payload = secretPayloadSchema.parse(JSON.parse(decrypted))

  if (secret.kind === 'LOGIN_CREDENTIALS') {
    return {
      ...secret,
      kind: 'LOGIN_CREDENTIALS',
      loginCredentials: normalizeLoginSecret(payload)
    }
  }

  return {
    ...secret,
    kind: 'TOTP',
    totp: normalizeTotpSecret(payload)
  }
}

export const decryptSecrets = async (
  secrets: SecretRecord[],
  masterKey: CryptoKey
): Promise<DecryptSecretsResult> => {
  const settled = await Promise.allSettled(
    secrets.map((secret) => decryptSecretRecord(secret, masterKey))
  )
  const decryptedSecrets = settled.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : []
  )
  const failedCount = settled.length - decryptedSecrets.length

  if (failedCount > 0) {
    console.warn(`Skipped ${failedCount} vault secrets that could not be decoded.`)
  }

  return {
    secrets: decryptedSecrets,
    failedCount
  }
}

export const encryptLoginSecret = (
  values: LoginSecretValues,
  masterKey: CryptoKey,
  salt: Uint8Array
) => encryptString(masterKey, JSON.stringify(values), salt)

export const encryptTotpSecret = (
  values: TotpSecretValues,
  masterKey: CryptoKey,
  salt: Uint8Array
) => encryptString(masterKey, JSON.stringify(values), salt)
