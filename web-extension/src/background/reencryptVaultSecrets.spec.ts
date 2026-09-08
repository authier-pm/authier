import { webcrypto } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  abToCryptoKey,
  bufferToBase64,
  cryptoKeyToString,
  decryptString,
  encryptString
} from '@shared/cryptoUtils'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { passkeySchema } from '@shared/passkeySchema'
import type { SecretSerializedType } from './backgroundPage'
import {
  applyPasswordRotation,
  reencryptVaultSecrets
} from './reencryptVaultSecrets'

let oldKey: CryptoKey
let oldKeySerialized: string
let newKey: CryptoKey
const salt = new Uint8Array(16).fill(3)
const saltSerialized = bufferToBase64(salt)
const payloads = [
  JSON.stringify({ username: 'alice', password: 'first password' }),
  JSON.stringify({ secret: 'JBSWY3DPEHPK3PXP', label: 'Příliš žluťoučký 🔐' })
]
let secrets: SecretSerializedType[]

beforeAll(async () => {
  vi.stubGlobal('crypto', webcrypto)
  oldKey = await abToCryptoKey(new Uint8Array(32).fill(1))
  newKey = await abToCryptoKey(new Uint8Array(32).fill(2))
  oldKeySerialized = await cryptoKeyToString(oldKey)
  secrets = await Promise.all(
    payloads.map(async (payload, index) => ({
      id: `00000000-0000-4000-8000-00000000000${index}`,
      kind:
        index === 0
          ? EncryptedSecretType.LOGIN_CREDENTIALS
          : EncryptedSecretType.TOTP,
      encrypted: await encryptString(oldKey, payload, salt),
      version: index + 4,
      createdAt: '2026-09-08T12:00:00.000Z'
    }))
  )
})

afterAll(() => vi.unstubAllGlobals())

describe('password rotation preparation', () => {
  it('preserves a synced passkey signing key and version through a mixed-vault rotation', async () => {
    const signingKeys = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    )
    const passkey = passkeySchema.parse({
      credentialId: 'Y3JlZGVudGlhbA',
      rpId: 'example.com',
      rpName: 'Example',
      userHandle: 'dXNlcg',
      userName: 'alice@example.com',
      userDisplayName: 'Alice',
      privateKeyJwk: await crypto.subtle.exportKey('jwk', signingKeys.privateKey),
      createdAt: '2026-09-08T10:00:00.000Z',
      url: 'https://example.com',
      label: 'Example',
      iconUrl: null
    })
    const serialized = JSON.stringify(passkey)
    const record: SecretSerializedType = {
      id: '00000000-0000-4000-8000-000000000002',
      kind: EncryptedSecretType.PASSKEY,
      encrypted: await encryptString(oldKey, serialized, salt),
      version: 9,
      createdAt: passkey.createdAt
    }
    const mixedSecrets = [...secrets, record]
    const patches = await reencryptVaultSecrets(
      mixedSecrets, oldKeySerialized, newKey, saltSerialized
    )
    const rotated = applyPasswordRotation(mixedSecrets, patches)
    const rotatedPasskey = rotated[2]
    expect(patches[2].expectedVersion).toBe(9)
    expect(rotatedPasskey).toMatchObject({ kind: EncryptedSecretType.PASSKEY, version: 10 })
    const restored = passkeySchema.parse(JSON.parse(await decryptString(newKey, rotatedPasskey.encrypted)))
    expect(restored).toEqual(passkey)
    expect(await decryptString(oldKey, record.encrypted)).toBe(serialized)
    const restoredSigningKey = await crypto.subtle.importKey(
      'jwk', restored.privateKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
    )
    const challenge = new TextEncoder().encode('passkey remains usable after changing the vault password')
    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, restoredSigningKey, challenge)
    expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, signingKeys.publicKey, signature, challenge)).toBe(true)
  })

  it('reencrypts multiple records using one stable old key and includes each exact version', async () => {
    const original = structuredClone(secrets)
    const patches = await reencryptVaultSecrets(
      secrets,
      oldKeySerialized,
      newKey,
      saltSerialized
    )
    expect(
      patches.map(({ id, expectedVersion, kind }) => ({
        id,
        expectedVersion,
        kind
      }))
    ).toEqual(
      secrets.map(({ id, version, kind }) => ({
        id,
        expectedVersion: version,
        kind
      }))
    )
    expect(
      await Promise.all(
        patches.map(({ encrypted }) => decryptString(newKey, encrypted))
      )
    ).toEqual(payloads)
    expect(
      await Promise.all(
        secrets.map(({ encrypted }) => decryptString(oldKey, encrypted))
      )
    ).toEqual(payloads)
    await expect(
      decryptString(oldKey, patches[0].encrypted)
    ).rejects.toThrow()
    expect(secrets).toEqual(original)
    const applied = applyPasswordRotation(secrets, patches)
    expect(applied.map(({ version }) => version)).toEqual([5, 6])
    expect(
      await Promise.all(
        applied.map(({ encrypted }) => decryptString(newKey, encrypted))
      )
    ).toEqual(payloads)
    expect(applied.map(({ createdAt }) => createdAt)).toEqual(
      secrets.map(({ createdAt }) => createdAt)
    )
  })

  it('leaves every original record usable if a corrupt ciphertext makes preparation fail', async () => {
    const corrupt = [
      ...secrets,
      { ...secrets[0], id: 'corrupt', encrypted: 'AAAA' }
    ]
    const original = structuredClone(corrupt)
    await expect(
      reencryptVaultSecrets(corrupt, oldKeySerialized, newKey, saltSerialized)
    ).rejects.toThrow()
    expect(corrupt).toEqual(original)
    expect(await decryptString(oldKey, secrets[0].encrypted)).toBe(
      payloads[0]
    )
  })

  it.each([undefined, 0, -1, 1.5])(
    'requires synchronization for an unknown or invalid cached version %s',
    async (version) => {
      await expect(
        reencryptVaultSecrets(
          [{ ...secrets[0], version }],
          oldKeySerialized,
          newKey,
          saltSerialized
        )
      ).rejects.toThrow('Synchronize the vault')
    }
  )

  it('omits tombstones rather than trying to decrypt or rotate them', async () => {
    const patches = await reencryptVaultSecrets(
      [
        secrets[0],
        {
          ...secrets[1],
          deletedAt: '2026-09-08T13:00:00.000Z',
          encrypted: ''
        }
      ],
      oldKeySerialized,
      newKey,
      saltSerialized
    )
    expect(patches).toHaveLength(1)
    expect(
      applyPasswordRotation(secrets, patches).map(({ id }) => id)
    ).toEqual([secrets[0].id])
  })
})
