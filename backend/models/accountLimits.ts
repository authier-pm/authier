export const defaultAccountLimits = {
  loginCredentialsLimit: 40,
  TOTPlimit: 3
} as const

export const webInputRemovalMinimumAccountAgeMs = 7 * 24 * 60 * 60 * 1000

export type AccountLimitUser = {
  loginCredentialsLimit: number
  TOTPlimit: number
}

export type AccountAgeUser = {
  createdAt: Date
}

export const hasHigherThanDefaultAccountLimits = (user: AccountLimitUser) =>
  user.loginCredentialsLimit > defaultAccountLimits.loginCredentialsLimit ||
  user.TOTPlimit > defaultAccountLimits.TOTPlimit

export const shouldApplyFreeUserRateLimit = (user: AccountLimitUser) =>
  !hasHigherThanDefaultAccountLimits(user)

export const isOldEnoughToRemoveWebInputs = (
  user: AccountAgeUser,
  now = new Date()
) =>
  now.getTime() - user.createdAt.getTime() >= webInputRemovalMinimumAccountAgeMs
