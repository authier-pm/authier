import { describe, expect, it } from 'vitest'
import { formatTotpToken, generateTotpToken, getTotpRemainingSeconds } from './totp'

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

  it('formats tokens into readable groups', () => {
    expect(formatTotpToken('287082')).toBe('287 082')
    expect(formatTotpToken('12345678')).toBe('123 456 78')
  })

  it('returns the remaining seconds in the current time window', () => {
    expect(getTotpRemainingSeconds(30, 59_000)).toBe(1)
    expect(getTotpRemainingSeconds(30, 60_000)).toBe(30)
  })
})
