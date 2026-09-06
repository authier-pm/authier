import { expect, it, vi } from 'vitest'
import {
  forgetRememberedVault,
  readRememberedVault,
  rememberVault
} from '@shared/rememberedVault'

const inspectPersistedRecord = () =>
  new Promise<{ key?: CryptoKey; ciphertext?: ArrayBuffer }>(
    (resolve, reject) => {
      const request = indexedDB.open('authier-device-vault', 1)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('snapshots', 'readonly')
        const record = tx.objectStore('snapshots').get('vault')
        tx.oncomplete = () => {
          db.close()
          resolve(record.result)
        }
        tx.onabort = () => {
          db.close()
          reject(tx.error)
        }
      }
      request.onerror = () => reject(request.error)
    }
  )

it('remembers unlock across database reopenings without storing raw vault keys', async () => {
  const snapshot = {
    masterKey: 'test-raw-master-key',
    secret: 'test-vault-password'
  }
  await rememberVault(snapshot)
  const record = await inspectPersistedRecord()
  expect(record.key?.extractable).toBe(false)
  expect(record.ciphertext).toBeDefined()
  expect(JSON.stringify(record)).not.toContain(snapshot.masterKey)
  expect(new TextDecoder().decode(record.ciphertext)).not.toContain(
    snapshot.secret
  )
  await expect(crypto.subtle.exportKey('raw', record.key!)).rejects.toThrow()
  expect(await readRememberedVault()).toEqual(snapshot)
})

it('uses a fresh IV and key for each persisted snapshot', async () => {
  await rememberVault({ secret: 'same-secret' })
  const first = await inspectPersistedRecord()
  await rememberVault({ secret: 'same-secret' })
  const second = await inspectPersistedRecord()
  expect(new Uint8Array(first.ciphertext!)).not.toEqual(
    new Uint8Array(second.ciphertext!)
  )
})

it('forgets both the wrapping key and ciphertext on lock or logout', async () => {
  await rememberVault({ masterKey: 'test-key' })
  await forgetRememberedVault()
  expect(await readRememberedVault()).toBeNull()
  expect((await inspectPersistedRecord()).key).toBeUndefined()
  expect((await inspectPersistedRecord()).ciphertext).toBeUndefined()
})

it('does not resurrect remembered state when a pending save finishes after locking', async () => {
  let started!: () => void
  let finish!: (value: ArrayBuffer) => void
  const encryptionStarted = new Promise<void>((resolve) => {
    started = resolve
  })
  const encryptionFinished = new Promise<ArrayBuffer>((resolve) => {
    finish = resolve
  })
  const spy = vi.spyOn(crypto.subtle, 'encrypt').mockImplementationOnce(() => {
    started()
    return encryptionFinished
  })
  const pendingSave = rememberVault({ masterKey: 'test-key' })
  await encryptionStarted
  await forgetRememberedVault()
  finish(new ArrayBuffer(16))
  await pendingSave
  spy.mockRestore()
  expect(await readRememberedVault()).toBeNull()
})
