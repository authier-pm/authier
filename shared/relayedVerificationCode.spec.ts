import { describe, expect, it } from 'bun:test'
import { relayedCodePayloadSchema } from './relayedVerificationCode'

describe('phone-extracted verification codes', () => {
  const payload = { v: 1, sender: 'Example', receivedAt: 1_790_000_000_000 }

  it('retains letter case and leading zeroes for model-supported codes', () => {
    for (const code of ['001234', 'qXaBpL', 'aB12cD34eF']) {
      expect(relayedCodePayloadSchema.parse({ ...payload, code }).code).toBe(
        code
      )
    }
  })

  it('rejects values outside the model format', () => {
    for (const code of ['123', '12345678901', '12 34', 'ab_cd', '１２３４']) {
      expect(
        relayedCodePayloadSchema.safeParse({ ...payload, code }).success
      ).toBe(false)
    }
  })
})
