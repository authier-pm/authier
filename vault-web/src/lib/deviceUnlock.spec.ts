import { beforeEach, expect, it, vi } from 'vitest'
import { bufferToBase64 } from '@shared/cryptoUtils'
import {
  cancelDeviceUnlock,
  discardOutdatedDeviceUnlock,
  enableDeviceUnlock,
  forgetDeviceUnlock,
  hasDeviceUnlock,
  unlockWithDevice
} from '@shared/deviceUnlock'

const accountId = 'account-1'
const masterKey = bufferToBase64(crypto.getRandomValues(new Uint8Array(32)))
let prf = crypto.getRandomValues(new Uint8Array(32))
let supported = true
let verified = true

class TestCredential {
  constructor(private readonly resultsAvailable = true) {}
  rawId = new Uint8Array([1, 2, 3]).buffer
  response = {
    getAuthenticatorData: () => {
      const data = new Uint8Array(37)
      data[32] = verified ? 0x05 : 0x01
      return data.buffer
    }
  }
  getClientExtensionResults() {
    if (!supported) return { prf: { enabled: false } }
    if (!this.resultsAvailable) return { prf: { enabled: true } }
    return { prf: { enabled: true, results: { first: prf.slice().buffer } } }
  }
}
const create = vi.fn()
const get = vi.fn()
const setup = (isCurrent = () => true) =>
  enableDeviceUnlock(
    { accountId, email: 'test@example.com', masterKey },
    isCurrent
  )

beforeEach(() => {
  vi.stubGlobal('PublicKeyCredential', TestCredential)
  Object.defineProperty(navigator, 'credentials', {
    configurable: true,
    value: { create, get }
  })
  supported = true
  verified = true
  prf = crypto.getRandomValues(new Uint8Array(32))
  create.mockReset().mockImplementation(async () => new TestCredential())
  get.mockReset().mockImplementation(async () => new TestCredential())
})

const storedRecord = () =>
  new Promise<Record<string, unknown>>((resolve, reject) => {
    const request = indexedDB.open('authier-passkey-unlock', 1)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction('unlock', 'readonly')
      const record = transaction.objectStore('unlock').get('vault')
      transaction.oncomplete = () => {
        db.close()
        resolve(record.result)
      }
      transaction.onabort = () => {
        db.close()
        reject(transaction.error)
      }
    }
    request.onerror = () => reject(request.error)
  })

const replaceRecord = (record: Record<string, unknown>) =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('authier-passkey-unlock', 1)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('unlock', 'readwrite')
      tx.objectStore('unlock').put(record, 'vault')
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onabort = () => {
        db.close()
        reject(tx.error)
      }
    }
    request.onerror = () => reject(request.error)
  })

it('stores only ciphertext and public metadata; the authenticator is needed even before logout', async () => {
  await setup()
  const stored = await storedRecord()
  expect(Object.keys(stored)).toEqual(['generation', 'envelope'])
  expect(Object.keys(stored.envelope as object).sort()).toEqual([
    'accountId',
    'ciphertext',
    'credentialId',
    'iv',
    'keyId',
    'rpId',
    'salt'
  ])
  expect(JSON.stringify(stored)).not.toContain(masterKey)
  expect(JSON.stringify(stored)).not.toContain(bufferToBase64(prf))
  expect(await unlockWithDevice(accountId)).toBe(masterKey)
  expect(get).toHaveBeenCalledWith(
    expect.objectContaining({
      publicKey: expect.objectContaining({ userVerification: 'required' })
    })
  )
  prf = crypto.getRandomValues(new Uint8Array(32))
  await expect(unlockWithDevice(accountId)).rejects.toThrow()
})

it('does not enroll an authenticator that cannot provide an encryption secret', async () => {
  supported = false
  await expect(setup()).rejects.toThrow('does not support vault unlock')
  expect(await hasDeviceUnlock(accountId)).toBe(false)
})

it('supports authenticators that expose PRF only after registration', async () => {
  create.mockResolvedValueOnce(new TestCredential(false))
  await setup()
  expect(get).toHaveBeenCalledOnce()
  expect(await unlockWithDevice(accountId)).toBe(masterKey)
})

it('rejects a different credential returned by the post-registration prompt', async () => {
  create.mockResolvedValueOnce(new TestCredential(false))
  const unexpected = new TestCredential()
  unexpected.rawId = new Uint8Array([4, 5, 6]).buffer
  get.mockResolvedValueOnce(unexpected)
  await expect(setup()).rejects.toThrow('Unexpected passkey')
  expect(await hasDeviceUnlock(accountId)).toBe(false)
})

it('authenticates the stored account metadata rather than trusting profile contents', async () => {
  await setup()
  const stored = await storedRecord()
  stored.envelope = {
    ...(stored.envelope as Record<string, unknown>),
    accountId: 'another-account'
  }
  await replaceRecord(stored)
  await expect(unlockWithDevice('another-account')).rejects.toThrow()
})

it('rejects PRF output without verified user presence', async () => {
  verified = false
  await expect(setup()).rejects.toThrow('Verify your identity')
  expect(await hasDeviceUnlock(accountId)).toBe(false)
})

it('binds the stored key to its account', async () => {
  await setup()
  await expect(unlockWithDevice('another-account')).rejects.toThrow(
    'No passkey unlock'
  )
  expect(get).not.toHaveBeenCalled()
})

it.each([cancelDeviceUnlock, forgetDeviceUnlock])(
  'does not finish enrolling after the session is locked or logged out',
  async (invalidate) => {
    let finish!: (value: TestCredential) => void
    create.mockImplementationOnce(
      () =>
        new Promise<TestCredential>((resolve) => {
          finish = resolve
        })
    )
    const enabling = setup()
    await vi.waitFor(() => expect(create).toHaveBeenCalled())
    await invalidate()
    finish(new TestCredential())
    await expect(enabling).rejects.toThrow('Vault session changed')
    expect(await hasDeviceUnlock(accountId)).toBe(false)
  }
)

it('checks the live session before persisting a completed prompt', async () => {
  await expect(setup(() => false)).rejects.toThrow('Vault session changed')
  expect(await hasDeviceUnlock(accountId)).toBe(false)
})

it('cancels an in-flight unlock while keeping the passkey available for a later explicit unlock', async () => {
  await setup()
  let finish!: (value: TestCredential) => void
  get.mockImplementationOnce(
    () =>
      new Promise<TestCredential>((resolve) => {
        finish = resolve
      })
  )
  const unlocking = unlockWithDevice(accountId)
  await vi.waitFor(() => expect(get).toHaveBeenCalled())
  await cancelDeviceUnlock()
  finish(new TestCredential())
  await expect(unlocking).rejects.toThrow('Vault session changed')
  expect(await hasDeviceUnlock(accountId)).toBe(true)
  expect(await unlockWithDevice(accountId)).toBe(masterKey)
})

it('forgets passkey unlock on logout and invalidates it after changing the vault key', async () => {
  await setup()
  await discardOutdatedDeviceUnlock(accountId, masterKey)
  expect(await hasDeviceUnlock(accountId)).toBe(true)
  await discardOutdatedDeviceUnlock(
    accountId,
    bufferToBase64(crypto.getRandomValues(new Uint8Array(32)))
  )
  expect(await hasDeviceUnlock(accountId)).toBe(false)
  await setup()
  await forgetDeviceUnlock()
  expect(await hasDeviceUnlock(accountId)).toBe(false)
  expect((await storedRecord()).envelope).toBeUndefined()
})
