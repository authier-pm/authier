import { afterEach, expect, it, vi } from 'vitest'
import { hashDeviceSecret } from './deviceSecretHash'

afterEach(() => vi.restoreAllMocks())

it('propagates unrelated crypto failures instead of silently falling back', async () => {
  const failure = new DOMException(
    'Unsupported hash algorithm',
    'NotSupportedError'
  )
  vi.spyOn(crypto.subtle, 'deriveBits').mockRejectedValueOnce(failure)
  await expect(hashDeviceSecret('synthetic-enrollment-secret')).rejects.toBe(
    failure
  )
})
