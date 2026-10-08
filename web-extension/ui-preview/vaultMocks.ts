import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import type { SecretTypeUnion } from '../src/background/ExtensionDevice'
import type { ISecret, IPasskeySecret } from '../src/util/useDeviceState'
import { passkeySchema } from '@shared/passkeySchema'

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

export const encodePreviewSecret = (value: string) =>
  btoa(encodeURIComponent(value))
export const decodePreviewPasskey = (encrypted: string) =>
  passkeySchema.parse(JSON.parse(decodeURIComponent(atob(encrypted))))

export const device = {
  state: {
    email: 'alex@example.com',
    secrets: [] as ISecret[],
    encrypt: async (value: string) => encodePreviewSecret(value),
    decrypt: async (encrypted: string) => decodeURIComponent(atob(encrypted)),
    decryptSecret: async (secret: ISecret): Promise<IPasskeySecret> => ({
      ...secret,
      kind: EncryptedSecretType.PASSKEY,
      passkey: decodePreviewPasskey(secret.encrypted)
    }),
    save: async () => undefined,
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
