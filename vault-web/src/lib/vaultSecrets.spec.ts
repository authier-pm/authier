import { describe, expect, it } from 'vitest'
import {
  decryptSecretRecord,
  decryptSecrets,
  encryptLoginSecret,
  encryptTotpSecret,
  getVaultSecretSearchText,
  getVaultSecretMetadata
} from './vaultSecrets'
import { encryptString, generateEncryptionKey } from '@shared/cryptoUtils'

describe('vaultSecrets', () => {
  it('round-trips encrypted login and TOTP records with the shared browser crypto helpers', async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const masterKey = await generateEncryptionKey('super secure password', salt)

    const encryptedLogin = await encryptLoginSecret(
      {
        label: 'GitHub',
        url: 'https://github.com',
        iconUrl: null,
        username: 'capaj',
        password: 'hunter2',
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )
    const encryptedTotp = await encryptTotpSecret(
      {
        label: 'Cloudflare',
        url: 'https://dash.cloudflare.com',
        iconUrl: null,
        secret: 'ABC123',
        digits: 6,
        period: 30,
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )

    const loginRecord = await decryptSecretRecord(
      {
        id: crypto.randomUUID(),
        encrypted: encryptedLogin,
        kind: 'LOGIN_CREDENTIALS',
        version: 1,
        createdAt: new Date('2026-03-25T10:00:00.000Z').toISOString(),
        updatedAt: null
      },
      masterKey
    )
    const totpRecord = await decryptSecretRecord(
      {
        id: crypto.randomUUID(),
        encrypted: encryptedTotp,
        kind: 'TOTP',
        version: 1,
        createdAt: new Date('2026-03-25T10:01:00.000Z').toISOString(),
        updatedAt: null
      },
      masterKey
    )

    expect(loginRecord.kind).toBe('LOGIN_CREDENTIALS')
    if (loginRecord.kind !== 'LOGIN_CREDENTIALS') {
      throw new Error('Expected login credentials record')
    }
    expect(loginRecord.loginCredentials.password).toBe('hunter2')
    expect(totpRecord.kind).toBe('TOTP')
    if (totpRecord.kind !== 'TOTP') {
      throw new Error('Expected TOTP record')
    }
    expect(totpRecord.totp.secret).toBe('ABC123')
  })

  it('keeps legacy secrets with missing newer fields and skips undecodable records', async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const masterKey = await generateEncryptionKey('super secure password', salt)
    const legacyEncryptedLogin = await encryptString(
      masterKey,
      JSON.stringify({
        label: 'Legacy GitHub',
        url: 'https://github.com',
        username: 'capaj',
        password: 'hunter2'
      }),
      salt
    )
    const invalidEncryptedRecord = await encryptString(
      masterKey,
      'not json',
      salt
    )

    const result = await decryptSecrets(
      [
        {
          id: crypto.randomUUID(),
          encrypted: legacyEncryptedLogin,
          kind: 'LOGIN_CREDENTIALS',
          version: 1,
          createdAt: new Date('2026-03-25T10:10:00.000Z').toISOString(),
          updatedAt: null
        },
        {
          id: crypto.randomUUID(),
          encrypted: invalidEncryptedRecord,
          kind: 'TOTP',
          version: 1,
          createdAt: new Date('2026-03-25T10:11:00.000Z').toISOString(),
          updatedAt: null
        }
      ],
      masterKey
    )

    expect(result.failedCount).toBe(1)
    expect(result.secrets).toHaveLength(1)
    expect(result.secrets[0]?.kind).toBe('LOGIN_CREDENTIALS')
    if (result.secrets[0]?.kind !== 'LOGIN_CREDENTIALS') {
      throw new Error('Expected login credentials record')
    }
    expect(result.secrets[0].loginCredentials.iconUrl).toBeNull()
    expect(result.secrets[0].loginCredentials.username).toBe('capaj')
  })
})

describe('passkey vault persistence', () => {
  it('round-trips a passkey with its signing key through encrypted sync records', async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const masterKey = await generateEncryptionKey(
      'passkey vault password',
      salt
    )
    const signingKeys = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    )
    const privateKeyJwk = await crypto.subtle.exportKey(
      'jwk',
      signingKeys.privateKey
    )
    const passkey = {
      credentialId: 'Y3JlZGVudGlhbA',
      rpId: 'example.com',
      rpName: 'Example',
      userHandle: 'dXNlcg',
      userName: 'alex@example.com',
      userDisplayName: 'Alex',
      privateKeyJwk,
      createdAt: '2026-09-08T10:00:00.000Z',
      url: 'https://example.com',
      label: 'Example passkey',
      iconUrl: null
    }
    const encrypted = await encryptString(
      masterKey,
      JSON.stringify(passkey),
      salt
    )
    expect(encrypted).not.toContain(privateKeyJwk.d)
    const restored = await decryptSecretRecord(
      {
        id: crypto.randomUUID(),
        kind: 'PASSKEY',
        encrypted,
        version: 1,
        createdAt: passkey.createdAt,
        updatedAt: null
      },
      masterKey
    )
    expect(restored.kind).toBe('PASSKEY')
    if (restored.kind !== 'PASSKEY') throw new Error('Expected passkey')
    expect(restored.passkey).toEqual(passkey)
    const restoredKey = await crypto.subtle.importKey(
      'jwk',
      restored.passkey.privateKeyJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    )
    const challenge = new TextEncoder().encode('new browser sign-in')
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      restoredKey,
      challenge
    )
    expect(
      await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        signingKeys.publicKey,
        signature,
        challenge
      )
    ).toBe(true)
    expect(getVaultSecretSearchText(restored)).toContain('alex@example.com')
    expect(getVaultSecretSearchText(restored)).not.toContain(privateKeyJwk.d)
    expect(getVaultSecretMetadata(restored)).not.toHaveProperty('privateKeyJwk')
  })
})
