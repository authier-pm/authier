import browser from 'webextension-polyfill'
import {
  deleteLegacyRememberedVaultDatabase,
  retireLegacyRememberedVault
} from '@shared/legacyRememberedVault'

export const cleanupLegacyVault = () =>
  retireLegacyRememberedVault(async () => {
    const origin = browser.runtime.getURL('').replace(/\/$/, '')
    if (origin.startsWith('moz-extension:')) {
      // Firefox has a separate SQLite file per database. Its browsingData API
      // deliberately excludes extension origins.
      await deleteLegacyRememberedVaultDatabase()
      return
    }
    // IndexedDB.deleteDatabase() alone leaves keys in Chromium's LevelDB files.
    // Explicitly scope removal to this extension; never remove website data.
    const options = { origins: [origin], originTypes: { extension: true } }
    await browser.browsingData.remove(options, { indexedDB: true })
  })
