const databaseName = 'authier-device-vault'
const storeName = 'snapshots'
const recordId = 'vault'
const additionalData = new TextEncoder().encode('authier-remembered-vault-v1')

type RememberedRecord = {
  generation: number
  key?: CryptoKey
  iv?: Uint8Array<ArrayBuffer>
  ciphertext?: ArrayBuffer
}

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(storeName)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const readRecord = async (): Promise<RememberedRecord> => {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const request = tx.objectStore(storeName).get(recordId)
    tx.oncomplete = () => {
      db.close()
      resolve(
        (request.result as RememberedRecord | undefined) ?? { generation: 0 }
      )
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error)
    }
  })
}

const updateRecord = async (
  update: (current: RememberedRecord) => RememberedRecord
) => {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.get(recordId)
    request.onsuccess = () =>
      store.put(
        update(
          (request.result as RememberedRecord | undefined) ?? { generation: 0 }
        ),
        recordId
      )
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error)
    }
  })
}

/** Encrypt before persisting; the wrapping key is never exported as raw bytes. */
export const rememberVault = async (snapshot: unknown) => {
  const { generation } = await readRecord()
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData },
    key,
    new TextEncoder().encode(JSON.stringify(snapshot))
  )
  // A lock/logout during encryption invalidates this pending write.
  await updateRecord((current) =>
    current.generation === generation
      ? { generation, key, iv, ciphertext }
      : current
  )
}

export const readRememberedVault = async (): Promise<unknown> => {
  const record = await readRecord()
  if (!record.key || !record.iv || !record.ciphertext || record.key.extractable)
    return null
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: record.iv, additionalData },
    record.key,
    record.ciphertext
  )
  if ((await readRecord()).generation !== record.generation) return null
  return JSON.parse(new TextDecoder().decode(plaintext)) as unknown
}

export const forgetRememberedVault = () =>
  updateRecord((current) => ({ generation: current.generation + 1 }))
