import { beforeEach, expect, it, vi } from 'vitest'
import { fetchRelayedVerificationCodes } from './relayedVerificationCodes'

const { device, query, decrypt } = vi.hoisted(() => {
  const decrypt = vi.fn<(encrypted: string) => Promise<string>>()
  return {
    decrypt,
    query: vi.fn(),
    device: { state: null as { decrypt: typeof decrypt } | null }
  }
})
vi.mock('./ExtensionDevice', () => ({
  device,
  deviceInitialization: Promise.resolve()
}))
vi.mock('@src/apollo/apolloClient', () => ({ apolloClient: { query } }))

const payload = JSON.stringify({
  v: 1,
  code: '482913',
  sender: 'Google',
  receivedAt: 1_780_000_000_000
})
const response = {
  data: {
    me: {
      relayedVerificationCodes: [
        {
          id: 'relay-id',
          encrypted: 'ciphertext',
          deviceName: 'Pixel 9',
          expiresAt: '2026-10-03T12:10:00Z'
        }
      ]
    }
  }
}

beforeEach(() => {
  query.mockReset().mockResolvedValue(response)
  decrypt.mockReset().mockResolvedValue(payload)
  device.state = { decrypt }
})

it('does not contact the backend while locked', async () => {
  device.state = null
  expect(await fetchRelayedVerificationCodes()).toEqual([])
  expect(query).not.toHaveBeenCalled()
})

it('decrypts relays with the unlocked key', async () => {
  expect(await fetchRelayedVerificationCodes()).toEqual([
    {
      ...JSON.parse(payload),
      id: 'relay-id',
      deviceName: 'Pixel 9',
      expiresAt: Date.parse('2026-10-03T12:10:00Z')
    }
  ])
  expect(decrypt).toHaveBeenCalledWith('ciphertext')
})

it('discards a response after locking during the network request', async () => {
  let finish!: (value: typeof response) => void
  query.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve
    })
  )
  const request = fetchRelayedVerificationCodes()
  await vi.waitFor(() => expect(query).toHaveBeenCalled())
  device.state = null
  finish(response)
  expect(await request).toEqual([])
  expect(decrypt).not.toHaveBeenCalled()
})

it('discards a decrypted code after switching sessions during decryption', async () => {
  let finish!: (value: string) => void
  decrypt.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve
    })
  )
  const request = fetchRelayedVerificationCodes()
  await vi.waitFor(() => expect(decrypt).toHaveBeenCalled())
  device.state = { decrypt }
  finish(payload)
  expect(await request).toEqual([])
})
