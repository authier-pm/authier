import { z } from 'zod'
import { base64ToBuffer, bufferToBase64 } from './cryptoUtils'

const databaseName = 'authier-passkey-unlock'
const storeName = 'unlock'
const additionalData = new TextEncoder().encode('authier-passkey-unlock-v1')
const unsupportedMessage =
  'This authenticator does not support vault unlock. Try a compatible device passkey or security key, or use your master password.'

const envelopeSchema = z.object({
  accountId: z.string(),
  credentialId: z.string(),
  rpId: z.string(),
  salt: z.string(),
  iv: z.string(),
  ciphertext: z.string(),
  keyId: z.string()
})
type Envelope = z.infer<typeof envelopeSchema>
const recordSchema = z.object({
  generation: z.string().min(1),
  envelope: envelopeSchema.optional()
})
type UnlockRecord = z.infer<typeof recordSchema>
type EnvelopeMetadata = Omit<Envelope, 'iv' | 'ciphertext'>
const envelopeAdditionalData = (metadata: EnvelopeMetadata) =>
  new TextEncoder().encode(
    JSON.stringify([
      'authier-passkey-unlock-v1',
      metadata.accountId,
      metadata.credentialId,
      metadata.rpId,
      metadata.salt,
      metadata.keyId
    ])
  )

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(storeName)
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => reject(request.error)
  })

const updateRecord = async (update: (record: UnlockRecord) => UnlockRecord) => {
  const db = await openDatabase()
  return new Promise<UnlockRecord>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.get('vault')
    let updated: UnlockRecord
    request.onsuccess = () => {
      const current = recordSchema.safeParse(request.result)
      updated = update(
        current.success ? current.data : { generation: crypto.randomUUID() }
      )
      store.put(updated, 'vault')
    }
    tx.oncomplete = () => {
      db.close()
      resolve(updated)
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error)
    }
  })
}
const readRecord = () => updateRecord((record) => record)

export const hasDeviceUnlock = async (accountId: string) => {
  const { envelope } = await readRecord()
  return (
    envelopeSchema.safeParse(envelope).success &&
    envelope?.accountId === accountId
  )
}

// Invalidate outstanding setup/unlock prompts even when keeping an existing
// passkey for the next explicit unlock. No secret is stored in this guard.
export const cancelDeviceUnlock = () =>
  updateRecord((record) => ({ ...record, generation: crypto.randomUUID() }))

export const forgetDeviceUnlock = () =>
  updateRecord(() => ({ generation: crypto.randomUUID() }))

const keyId = async (key: string) =>
  bufferToBase64(await crypto.subtle.digest('SHA-256', base64ToBuffer(key)))

export const discardOutdatedDeviceUnlock = async (
  accountId: string,
  key: string
) => {
  const id = await keyId(key)
  await updateRecord((record) => {
    if (
      !record.envelope ||
      (record.envelope.accountId === accountId && record.envelope.keyId === id)
    )
      return record
    return { generation: crypto.randomUUID() }
  })
}

const rpId = () => {
  if (location.protocol.endsWith('-extension:')) return 'authier.pm'
  return location.hostname
}

const publicKeyCredential = (credential: Credential | null) => {
  if (!(credential instanceof PublicKeyCredential))
    throw new Error(
      'Passkey unlock was cancelled. Your master password still works.'
    )
  return credential
}

const requireUserVerification = (credential: PublicKeyCredential) => {
  const response = credential.response
  const data =
    'authenticatorData' in response
      ? (response as AuthenticatorAssertionResponse).authenticatorData
      : (response as AuthenticatorAttestationResponse).getAuthenticatorData()
  // Flags follow the 32-byte RP ID hash. Require both presence and verification.
  if (data.byteLength < 37 || (new Uint8Array(data)[32] & 0x05) !== 0x05)
    throw new Error(
      'Verify your identity with your device PIN or biometrics to unlock.'
    )
}

const deriveWrappingKey = async (credential: PublicKeyCredential) => {
  requireUserVerification(credential)
  const output = credential.getClientExtensionResults().prf?.results?.first
  if (!output || output.byteLength !== 32) throw new Error(unsupportedMessage)
  const bytes = ArrayBuffer.isView(output)
    ? new Uint8Array(output.buffer, output.byteOffset, output.byteLength)
    : new Uint8Array(output)
  const material = await crypto.subtle.importKey('raw', bytes, 'HKDF', false, [
    'deriveKey'
  ])
  bytes.fill(0)
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: additionalData,
      info: additionalData
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

const getCredential = async (
  envelope: Pick<Envelope, 'rpId' | 'credentialId' | 'salt'>
) =>
  publicKeyCredential(
    await navigator.credentials.get({
      publicKey: {
        rpId: envelope.rpId,
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [
          { type: 'public-key', id: base64ToBuffer(envelope.credentialId) }
        ],
        userVerification: 'required',
        extensions: { prf: { eval: { first: base64ToBuffer(envelope.salt) } } },
        timeout: 60_000
      }
    })
  )

export const enableDeviceUnlock = async (
  {
    accountId,
    email,
    masterKey
  }: { accountId: string; email: string; masterKey: string },
  isCurrentSession: () => boolean
) => {
  if (
    typeof PublicKeyCredential === 'undefined' ||
    !navigator.credentials?.create
  )
    throw new Error(unsupportedMessage)
  const { generation } = await readRecord()
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const relyingParty = rpId()
  const credential = publicKeyCredential(
    await navigator.credentials.create({
      publicKey: {
        rp: { id: relyingParty, name: 'Authier vault unlock' },
        user: {
          id: crypto.getRandomValues(new Uint8Array(32)),
          name: email,
          displayName: `Authier · ${email}`
        },
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'required'
        },
        extensions: { prf: { eval: { first: salt } } },
        timeout: 60_000,
        attestation: 'none'
      }
    })
  )
  const metadata = {
    accountId,
    credentialId: bufferToBase64(credential.rawId),
    rpId: relyingParty,
    salt: bufferToBase64(salt),
    keyId: await keyId(masterKey)
  }
  // Some authenticators expose PRF only on get(), after registration.
  if (credential.getClientExtensionResults().prf?.enabled !== true)
    throw new Error(unsupportedMessage)
  const wrappingCredential = credential.getClientExtensionResults().prf?.results
    ? credential
    : await getCredential(metadata)
  if (bufferToBase64(wrappingCredential.rawId) !== metadata.credentialId)
    throw new Error('Unexpected passkey')
  const wrappingKey = await deriveWrappingKey(wrappingCredential)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const rawKey = base64ToBuffer(masterKey)
  if (rawKey.byteLength !== 32) throw new Error('Invalid vault key')
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: envelopeAdditionalData(metadata) },
    wrappingKey,
    rawKey
  )
  rawKey.fill(0)
  const envelope: Envelope = {
    ...metadata,
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext)
  }
  const saved = await updateRecord((record) => {
    if (record.generation !== generation || !isCurrentSession()) return record
    return { generation, envelope }
  })
  if (saved.envelope?.credentialId !== metadata.credentialId)
    throw new Error('Vault session changed. Unlock and try again.')
}

export const unlockWithDevice = async (accountId: string) => {
  const { envelope: stored, generation } = await readRecord()
  const envelope = envelopeSchema.parse(stored)
  if (envelope.accountId !== accountId)
    throw new Error('No passkey unlock for this account')
  // The current page determines the RP, never mutable profile data.
  if (envelope.rpId !== rpId())
    throw new Error('Passkey belongs to another Authier origin')
  const credential = await getCredential(envelope)
  if (bufferToBase64(credential.rawId) !== envelope.credentialId)
    throw new Error('Unexpected passkey')
  const key = await deriveWrappingKey(credential)
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: base64ToBuffer(envelope.iv),
      additionalData: envelopeAdditionalData(envelope)
    },
    key,
    base64ToBuffer(envelope.ciphertext)
  )
  const bytes = new Uint8Array(plaintext)
  const masterKey = bufferToBase64(bytes)
  bytes.fill(0)
  if ((await readRecord()).generation !== generation)
    throw new Error('Vault session changed. Try unlocking again.')
  return masterKey
}
