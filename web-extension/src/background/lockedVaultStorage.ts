import browser from 'webextension-polyfill'
import { backgroundStateSerializableLockedSchema } from './backgroundSchemas'

// Zod strips unknown fields, including raw keys, plaintext enrollment secrets,
// decrypted secret caches, and extra properties attached to individual secrets.
export const lockedVaultSnapshotSchema =
  backgroundStateSerializableLockedSchema.omit({
    masterEncryptionKey: true,
    authSecret: true
  })

const legacyCredentialKeys = [
  'backgroundState',
  'access-token',
  'currentAddDeviceSecret',
  'addDeviceSecretEncrypted',
  'lastAutofilledValue',
  'generatedPasswordHistory'
]

export const readLockedVaultSnapshot = async () => {
  const stored = await browser.storage.local.get([
    'lockedState',
    'backgroundState'
  ])
  const parsed = lockedVaultSnapshotSchema.safeParse(
    stored.backgroundState ?? stored.lockedState
  )
  await browser.storage.local.remove(legacyCredentialKeys)
  if (!parsed.success) {
    await browser.storage.local.remove('lockedState')
    return null
  }
  // Overwrite legacy snapshots with an explicit ciphertext-only allowlist.
  await browser.storage.local.set({ lockedState: parsed.data })
  return parsed.data
}

export const saveLockedVaultSnapshot = async (state: unknown) => {
  const lockedState = lockedVaultSnapshotSchema.parse(state)
  await browser.storage.local.set({ lockedState })
}
