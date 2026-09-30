import {
  bufferToBase64,
  cryptoKeyToString,
  encryptString,
  generateEncryptionKey,
  initLocalDeviceAuthSecret
} from '../../../shared/cryptoUtils'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import type { IBackgroundStateSerializable } from '../../src/background/backgroundPage'
import type { PasskeyData } from '../../../shared/passkeySchema'

/** Synthetic ciphertext for rendering the production vault in a disposable extension. */
export const createOfflineVaultSnapshot =
  async (): Promise<IBackgroundStateSerializable> => {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const key = await generateEncryptionKey('offline-preview-password', salt)
    const auth = await initLocalDeviceAuthSecret(key, salt)
    const createdAt = '2026-09-30T08:00:00.000Z'
    const signingKeys = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    )
    const privateKey = await crypto.subtle.exportKey(
      'jwk',
      signingKeys.privateKey
    )
    const passkey: PasskeyData = {
      credentialId: 'cHJldmlldy1jcmVkZW50aWFs',
      rpId: 'example.com',
      rpName: 'Example',
      userHandle: 'YWxleA',
      userName: 'alex@example.com',
      userDisplayName: 'Alex',
      privateKeyJwk: {
        kty: 'EC',
        crv: 'P-256',
        x: privateKey.x!,
        y: privateKey.y!,
        d: privateKey.d!
      },
      createdAt,
      url: 'https://example.com',
      label: 'Example Passkey',
      iconUrl: null
    }
    const items = [
      {
        kind: EncryptedSecretType.LOGIN_CREDENTIALS,
        value: {
          label: 'Example Mail',
          username: 'alex@example.com',
          password: 'mail-preview-password',
          url: 'https://mail.example.com',
          iconUrl: null
        }
      },
      {
        kind: EncryptedSecretType.LOGIN_CREDENTIALS,
        value: {
          label: 'Example Notes',
          username: 'alex@example.com',
          password: 'notes-preview-password',
          url: 'https://notes.example.com',
          iconUrl: null
        }
      },
      {
        kind: EncryptedSecretType.TOTP,
        value: {
          label: 'Work authenticator',
          secret: 'JBSWY3DPEHPK3PXP',
          url: 'https://work.example.com',
          iconUrl: null
        }
      },
      { kind: EncryptedSecretType.PASSKEY, value: passkey }
    ]
    return {
      email: 'alex@example.com',
      userId: 'offline-preview-user',
      deviceName: 'Preview browser',
      encryptionSalt: bufferToBase64(salt),
      masterEncryptionKey: await cryptoKeyToString(key),
      authSecret: auth.addDeviceSecret,
      authSecretEncrypted: auth.addDeviceSecretEncrypted,
      secrets: await Promise.all(
        items.map(async ({ kind, value }, index) => ({
          id: `offline-preview-${index}`,
          kind,
          createdAt,
          version: 1,
          encrypted: await encryptString(key, JSON.stringify(value), salt)
        }))
      ),
      vaultLockTimeoutSeconds: 0,
      syncTOTP: true,
      autofillCredentialsEnabled: false,
      autofillTOTPEnabled: false,
      autofillForbiddenUrlPatterns: '',
      uiLanguage: 'en',
      theme: 'dark',
      notificationOnVaultUnlock: false,
      notificationOnWrongPasswordAttempts: 3
    }
  }
