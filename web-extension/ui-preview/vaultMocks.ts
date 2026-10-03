import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import type { SecretTypeUnion } from '../src/background/ExtensionDevice'

export const pathNameToTypes = {
  '/credentials': [EncryptedSecretType.LOGIN_CREDENTIALS],
  '/totps': [EncryptedSecretType.TOTP],
  '/passkeys': [EncryptedSecretType.PASSKEY],
  '/': Object.values(EncryptedSecretType)
}

export const getDecryptedSecretProp = (
  secret: SecretTypeUnion,
  prop: 'url' | 'label' | 'iconUrl' | 'username' | 'password' | 'totp'
): string => {
  if (secret.kind === EncryptedSecretType.PASSKEY) {
    if (prop === 'username') return secret.passkey.userName
    if (prop === 'url' || prop === 'label' || prop === 'iconUrl')
      return secret.passkey[prop] ?? ''
    return ''
  }
  const data =
    secret.kind === EncryptedSecretType.TOTP
      ? secret.totp
      : secret.loginCredentials
  const value: unknown = data[prop]
  return typeof value === 'string' ? value : ''
}

export const device = {
  state: {
    email: 'alex@example.com',
    backendSync: async () => ({ newAndUpdatedSecrets: 0, removedSecrets: 0 }),
    removeSecrets: async () => undefined,
    removeSecret: async () => undefined
  },
  lock: async () => undefined,
  logout: async () => undefined
}

export const toast = () => undefined
export const useAppToast = () => toast
export const useThemeMode = () => ({
  colorMode: 'dark',
  toggleColorMode: () => undefined
})
