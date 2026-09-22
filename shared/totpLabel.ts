import { z } from 'zod'

export const isTotpAccountEmail = (value: string) =>
  z.email().safeParse(value.trim()).success

export const getTotpAccountEmail = (label: string) =>
  label
    .split(/[:|]/)
    .map((part) => part.trim())
    .find(isTotpAccountEmail)

export const formatTotpLabel = (email: string, provider: string) => {
  const accountEmail = email.trim()
  if (!isTotpAccountEmail(accountEmail)) {
    throw new Error('Enter the account email for this TOTP code')
  }

  const providerName = provider.trim()
  return providerName ? `${accountEmail} | ${providerName}` : accountEmail
}
