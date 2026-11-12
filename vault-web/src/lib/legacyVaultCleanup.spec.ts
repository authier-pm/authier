import { afterEach, expect, it, vi } from 'vitest'
import {
  deleteLegacyRememberedVaultDatabase,
  retireLegacyRememberedVault
} from '@shared/legacyRememberedVault'
import { clearLegacyVaultStorage } from '../worker'

afterEach(deleteLegacyRememberedVaultDatabase)

it('removes the old database and prevents older clients recreating the key store', async () => {
  await deleteLegacyRememberedVaultDatabase()
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('authier-device-vault', 1)
    request.onupgradeneeded = () =>
      request.result.createObjectStore('snapshots')
    request.onsuccess = () => {
      request.result.close()
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
  const purge = vi.fn(deleteLegacyRememberedVaultDatabase)
  await retireLegacyRememberedVault(purge)
  await retireLegacyRememberedVault(purge)
  expect(purge).toHaveBeenCalledOnce()
  await expect(
    new Promise((resolve, reject) => {
      const request = indexedDB.open('authier-device-vault', 1)
      request.onsuccess = () => {
        request.result.close()
        resolve(null)
      }
      request.onerror = () => reject(request.error)
    })
  ).rejects.toMatchObject({ name: 'VersionError' })
})

it('does not mark cleanup complete when file removal fails', async () => {
  await deleteLegacyRememberedVaultDatabase()
  await new Promise<void>((resolve) => {
    const request = indexedDB.open('authier-device-vault', 1)
    request.onsuccess = () => {
      request.result.close()
      resolve()
    }
  })
  await expect(
    retireLegacyRememberedVault(async () => {
      throw new Error('purge failed')
    })
  ).rejects.toThrow('purge failed')
  expect(
    (await indexedDB.databases()).find(
      (db) => db.name === 'authier-device-vault'
    )?.version
  ).toBe(1)
})

it('serves the purge header only for an explicit same-origin POST', () => {
  const url = 'https://vault.authier.pm/clear-legacy-vault'
  const allowed = clearLegacyVaultStorage(
    new Request(url, {
      method: 'POST',
      headers: {
        Origin: 'https://vault.authier.pm',
        'Sec-Fetch-Site': 'same-origin'
      }
    })
  )
  expect(allowed?.status).toBe(204)
  expect(allowed?.headers.get('Clear-Site-Data')).toBe('"storage"')
  for (const request of [
    new Request(url),
    new Request(url, {
      method: 'POST',
      headers: {
        Origin: 'https://attacker.example',
        'Sec-Fetch-Site': 'cross-site'
      }
    })
  ]) {
    const rejected = clearLegacyVaultStorage(request)
    expect(rejected?.status).toBe(403)
    expect(rejected?.headers.has('Clear-Site-Data')).toBe(false)
  }
})
