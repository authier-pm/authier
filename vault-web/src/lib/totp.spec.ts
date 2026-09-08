import { describe, expect, it } from 'vitest'
import { generateTotpTokenSync } from '@shared/totp'
import {
  formatTotpToken,
  generateTotpToken,
  getTotpRemainingSeconds
} from './totp'

describe('totp helpers', () => {
  it('generates the expected 6-digit token for a known RFC test vector', async () => {
    const token = await generateTotpToken({
      secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
      digits: 6,
      period: 30,
      now: 59_000
    })

    expect(token).toBe('287082')
  })

  it('generates tokens for legacy short secrets', async () => {
    const token = await generateTotpToken({
      secret: 'JBSWY3DPEHPK3PXP',
      digits: 6,
      period: 30,
      now: 59_000
    })

    expect(token).toBe('996554')
  })

  it('keeps short-secret codes stable until the exact boundary in both clients', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    for (const now of [29_499, 29_500, 29_999]) {
      expect(
        await generateTotpToken({ secret, digits: 6, period: 30, now })
      ).toBe('282760')
      expect(
        generateTotpTokenSync({ secret, digits: 6, period: 30, now })
      ).toBe('282760')
    }
    expect(
      await generateTotpToken({ secret, digits: 6, period: 30, now: 30_000 })
    ).toBe('996554')
    expect(
      generateTotpTokenSync({ secret, digits: 6, period: 30, now: 30_000 })
    ).toBe('996554')
  })

  it('formats tokens into readable groups', () => {
    expect(formatTotpToken('287082')).toBe('287 082')
    expect(formatTotpToken('12345678')).toBe('123 456 78')
  })

  it('returns the remaining seconds in the current time window', () => {
    expect(getTotpRemainingSeconds(30, 59_000)).toBe(1)
    expect(getTotpRemainingSeconds(30, 60_000)).toBe(30)
  })
})
