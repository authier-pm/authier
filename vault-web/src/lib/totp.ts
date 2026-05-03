import { generateTotpToken as generateSharedTotpToken } from '@shared/totp'

type TotpOptions = {
  secret: string
  digits: number
  period: number
  now?: number
}

export const formatTotpToken = (token: string) =>
  token.match(/.{1,3}/g)?.join(' ') ?? token

export const getTotpRemainingSeconds = (period: number, now = Date.now()) => {
  if (!Number.isInteger(period) || period <= 0) {
    return 0
  }

  const elapsedSeconds = Math.floor(now / 1000) % period
  return period - elapsedSeconds
}

export const generateTotpToken = async ({
  secret,
  digits,
  period,
  now = Date.now()
}: TotpOptions): Promise<string | null> =>
  generateSharedTotpToken({ secret, digits, period, now })
