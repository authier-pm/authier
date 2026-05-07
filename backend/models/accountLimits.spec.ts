import { describe, expect, it } from 'vitest'
import {
  defaultAccountLimits,
  isOldEnoughToRemoveWebInputs,
  shouldApplyFreeUserRateLimit,
  webInputRemovalMinimumAccountAgeMs
} from './accountLimits'

describe('accountLimits', () => {
  it('applies web input delete rate limits to default-limit users', () => {
    expect(shouldApplyFreeUserRateLimit(defaultAccountLimits)).toBe(true)
  })

  it('skips web input delete rate limits for users above default account limits', () => {
    expect(
      shouldApplyFreeUserRateLimit({
        ...defaultAccountLimits,
        loginCredentialsLimit: defaultAccountLimits.loginCredentialsLimit + 1
      })
    ).toBe(false)
    expect(
      shouldApplyFreeUserRateLimit({
        ...defaultAccountLimits,
        TOTPlimit: defaultAccountLimits.TOTPlimit + 1
      })
    ).toBe(false)
  })

  it('allows web input removal only once the account is at least a week old', () => {
    const now = new Date('2026-05-07T00:00:00.000Z')

    expect(
      isOldEnoughToRemoveWebInputs(
        {
          createdAt: new Date(
            now.getTime() - webInputRemovalMinimumAccountAgeMs
          )
        },
        now
      )
    ).toBe(true)

    expect(
      isOldEnoughToRemoveWebInputs(
        {
          createdAt: new Date(
            now.getTime() - webInputRemovalMinimumAccountAgeMs + 1
          )
        },
        now
      )
    ).toBe(false)
  })
})
