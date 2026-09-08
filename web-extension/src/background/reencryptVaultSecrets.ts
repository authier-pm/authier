import {
  abToCryptoKey,
  base64ToBuffer,
  decryptString,
  encryptString
} from '@shared/cryptoUtils'
import type { EncryptedSecretPatchInput } from '@shared/generated/graphqlBaseTypes'
import type { SecretSerializedType } from './backgroundPage'

export type VersionedSecretPatch = EncryptedSecretPatchInput & {
  expectedVersion: number
}

/** Prepare a rotation without changing the live key or any cached ciphertext. */
export async function reencryptVaultSecrets(
  secrets: readonly SecretSerializedType[],
  previousKey: string,
  nextKey: CryptoKey,
  encryptionSalt: string
): Promise<VersionedSecretPatch[]> {
  const activeSecrets = secrets.filter((secret) => !secret.deletedAt)
  const versionedSecrets = activeSecrets.map((secret) => {
    const version = secret.version
    if (
      version === undefined ||
      !Number.isSafeInteger(version) ||
      version < 1
    ) {
      throw new Error(
        'Synchronize the vault before changing the master password'
      )
    }
    return { ...secret, version }
  })
  const oldKey = await abToCryptoKey(base64ToBuffer(previousKey))
  const salt = base64ToBuffer(encryptionSalt)
  return Promise.all(
    versionedSecrets.map(async ({ id, encrypted, kind, version }) => ({
      id,
      kind,
      expectedVersion: version,
      encrypted: await encryptString(
        nextKey,
        await decryptString(oldKey, encrypted),
        salt
      )
    }))
  )
}

export function applyPasswordRotation(
  secrets: readonly SecretSerializedType[],
  patches: readonly VersionedSecretPatch[]
): SecretSerializedType[] {
  const previousSecrets = new Map(
    secrets.map((secret) => [secret.id, secret])
  )
  return patches.map(({ id, encrypted, expectedVersion }) => {
    const previous = previousSecrets.get(id)
    if (!previous || previous.version !== expectedVersion) {
      throw new Error('Vault changed during password rotation')
    }
    return { ...previous, encrypted, version: expectedVersion + 1 }
  })
}
