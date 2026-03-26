import { getDecryptedSecretProp, type SecretTypeUnion } from '@src/background/ExtensionDevice'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import type { ITOTPSecret } from '@src/util/useDeviceState'
import { generateSync } from 'otplib'

export const isTotpSecret = (
  secret: SecretTypeUnion
): secret is ITOTPSecret => secret.kind === EncryptedSecretType.TOTP

export const getSecretLabel = (secret: SecretTypeUnion) =>
  getDecryptedSecretProp(secret, 'label') || 'Untitled'

export const getSecretUrl = (secret: SecretTypeUnion) =>
  getDecryptedSecretProp(secret, 'url')

export const getSecretUsername = (secret: SecretTypeUnion) =>
  isTotpSecret(secret) ? '' : getDecryptedSecretProp(secret, 'username')

export const getSecretValue = (secret: SecretTypeUnion) =>
  isTotpSecret(secret) ? secret.totp.secret : getDecryptedSecretProp(secret, 'password')

export const getMaskedSecretValue = (secret: SecretTypeUnion) =>
  '*'.repeat(Math.max(getSecretValue(secret).length, 8))

export const getSecretKindLabel = (secret: SecretTypeUnion) =>
  isTotpSecret(secret) ? 'TOTP' : 'Credential'

export const getSecretCopyValue = (secret: SecretTypeUnion) =>
  isTotpSecret(secret)
    ? generateSync({ secret: secret.totp.secret })
    : getDecryptedSecretProp(secret, 'password')

export const getNavigableSecretUrl = (secret: SecretTypeUnion) => {
  const rawUrl = getSecretUrl(secret).trim()

  if (!rawUrl) {
    return null
  }

  return /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
}
