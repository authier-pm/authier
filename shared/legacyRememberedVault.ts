const databaseName = 'authier-device-vault'

export const deleteLegacyRememberedVaultDatabase = () =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })

/** Retire the old store without ever reading or importing its persisted keys.
 * The supplied purge must remove the browser's backing files, not just records.
 * This cannot erase previous filesystem snapshots, backups or disk remnants.
 */
export const retireLegacyRememberedVault = (purge: () => Promise<void>) =>
  navigator.locks.request('authier-retire-remembered-vault', async () => {
    const databases = await indexedDB.databases()
    const legacy = databases.find(({ name }) => name === databaseName)
    if (legacy?.version === 2) return
    if (legacy) await purge()

    // A keyless v2 tombstone blocks older clients opening v1. If an older tab
    // recreates v1 in the gap after purge, abort the upgrade and purge again:
    // deleting its object store would leave its keys in LevelDB history again.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const clean = await new Promise<boolean>((resolve, reject) => {
        const request = indexedDB.open(databaseName, 2)
        let recreated = false
        request.onupgradeneeded = (event) => {
          if (event.oldVersion !== 0) {
            recreated = true
            request.transaction?.abort()
          }
        }
        request.onsuccess = () => {
          request.result.close()
          resolve(true)
        }
        request.onerror = () => {
          if (recreated) resolve(false)
          else reject(request.error)
        }
      })
      if (clean) return
      await purge()
    }
    throw new Error('Close other Authier tabs and retry the security update.')
  })
