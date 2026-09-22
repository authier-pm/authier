import { getTotpAccountEmail } from '@shared/totpLabel'

export const parseTotpProvisioning = (data: string) => {
  const uri = new URL(data)
  if (uri.protocol !== 'otpauth:' || uri.hostname !== 'totp') {
    throw new Error('Scan a TOTP setup QR code')
  }

  const secret = uri.searchParams.get('secret')
  if (!secret) {
    throw new Error('QR code does not have any secret')
  }

  const label = decodeURIComponent(uri.pathname.slice(1)).trim()
  const separator = label.indexOf(':')
  const labelIssuer = separator === -1 ? '' : label.slice(0, separator).trim()
  const accountEmail = getTotpAccountEmail(label)
  const issuer = uri.searchParams.get('issuer')?.trim() || labelIssuer
  const provider = issuer || (accountEmail ? '' : label)

  return { secret, accountEmail, provider }
}
