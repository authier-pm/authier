import { z } from 'zod'
import { retireLegacyRememberedVault } from '@shared/legacyRememberedVault'

const lockedStateSchema = z.object({
  userId: z.string(),
  email: z.string(),
  deviceName: z.string(),
  encryptionSalt: z.string(),
  authSecretEncrypted: z.string(),
  vaultLockTimeoutSeconds: z.number()
})

export const cleanupLegacyVault = () =>
  retireLegacyRememberedVault(async () => {
    const deviceId = localStorage.getItem('authier-vault-device-id')
    const rawLocked = localStorage.getItem('authier-vault-locked-state')
    const locked = lockedStateSchema.safeParse(
      rawLocked ? JSON.parse(rawLocked) : null
    )
    // This must be a response from the vault origin, not the separate API origin.
    const response = await fetch('/clear-legacy-vault', {
      method: 'POST',
      cache: 'no-store'
    }).finally(() => {
      // Preserve this identity even if the response is lost after the browser
      // clears storage. Restore only public and password-encrypted metadata.
      if (deviceId) localStorage.setItem('authier-vault-device-id', deviceId)
      if (locked.success)
        localStorage.setItem(
          'authier-vault-locked-state',
          JSON.stringify(locked.data)
        )
    })
    // Browsers may consume/remove Clear-Site-Data before exposing the response
    // to JavaScript. Verify its effect instead of reading that header here.
    if (response.status !== 204)
      throw new Error(
        'Connect to the internet to finish the vault security update.'
      )
    const remaining = await indexedDB.databases()
    if (remaining.some(({ name }) => name === 'authier-device-vault'))
      throw new Error(
        'Your browser could not clear old vault data. Clear site data for this vault before signing in again.'
      )
  })
