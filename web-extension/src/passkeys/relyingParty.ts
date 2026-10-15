import { getDomainNameAndTldFromUrl } from '@shared/urlUtils'
import { z } from 'zod'

const mismatch = () =>
  new DOMException(
    'The passkey domain does not authorize this website',
    'SecurityError'
  )

const parseRelatedOrigin = (value: string) => {
  // Malformed entries in a well-known document are ignored by WebAuthn.
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

/** Only constructed after checking the RP's HTTPS well-known document. */
class RelatedOriginAuthorization {
  private constructor(
    readonly rpId: string,
    readonly origin: string
  ) {
    Object.freeze(this)
  }

  static async authorize(rpId: string, origin: string) {
    // No cookies or referrer; reject redirects to prevent HTTPS downgrades.
    // Errors are deliberately mapped to SecurityError without exposing responses.
    const response = await fetch(`https://${rpId}/.well-known/webauthn`, {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      signal: AbortSignal.timeout(5_000)
    }).catch(() => {
      throw mismatch()
    })
    if (
      response.status !== 200 ||
      response.headers
        .get('content-type')
        ?.split(';')[0]
        .trim()
        .toLowerCase() !== 'application/json' ||
      !response.body
    )
      throw mismatch()

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let size = 0
    let text = ''
    // Bound untrusted response bodies even when Content-Length is absent.
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 65_536) {
          await reader.cancel()
          throw mismatch()
        }
        text += decoder.decode(value, { stream: true })
      }
    } finally {
      reader.releaseLock()
    }
    text += decoder.decode()
    const document: unknown = await new Response(text).json().catch(() => {
      throw mismatch()
    })
    const parsed = z
      .object({ origins: z.array(z.string()) })
      .safeParse(document)
    if (!parsed.success) throw mismatch()

    // WebAuthn limits distinct registrable labels, not the number of origins.
    const labels = new Set<string>()
    for (const candidate of parsed.data.origins) {
      const url = parseRelatedOrigin(candidate)
      if (!url || url.protocol !== 'https:') continue
      const domain = getDomainNameAndTldFromUrl(url.href)
      if (!domain) continue
      const label = domain.split('.')[0]
      if (!labels.has(label)) {
        if (labels.size >= 5) continue
        labels.add(label)
      }
      if (url.origin === origin)
        return new RelatedOriginAuthorization(rpId, origin)
    }
    throw mismatch()
  }
}

export type PasskeyOrigin = string | RelatedOriginAuthorization
export const getPasskeyOrigin = (origin: PasskeyOrigin): string =>
  typeof origin === 'string' ? origin : origin.origin

/** Validate syntax before using a page-provided RP ID in a network request. */
export const parseRpId = (
  requestedRpId: string | undefined,
  origin: string
): string => {
  const url = new URL(origin)
  if (
    url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && url.hostname === 'localhost')
  )
    throw new DOMException('Passkeys require a secure website', 'SecurityError')
  const rpId = requestedRpId ?? url.hostname
  const isDomain =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
      rpId
    )
  if (!isDomain || rpId.length > 253) throw mismatch()
  if (rpId === 'localhost' && url.hostname === 'localhost') return rpId
  if (!getDomainNameAndTldFromUrl(`https://${rpId}`))
    throw new DOMException(
      'A passkey domain must be a registrable domain',
      'SecurityError'
    )
  return rpId
}

const isSameDomain = (rpId: string, origin: string) => {
  const { hostname } = new URL(origin)
  return rpId === hostname || hostname.endsWith(`.${rpId}`)
}

/** Origin comes from trusted browser sender metadata, never the request payload. */
export const authorizePasskeyOrigin = async (
  requestedRpId: string | undefined,
  origin: string
): Promise<PasskeyOrigin> => {
  const rpId = parseRpId(requestedRpId, origin)
  const canonicalOrigin = new URL(origin).origin
  if (isSameDomain(rpId, canonicalOrigin)) return canonicalOrigin
  return RelatedOriginAuthorization.authorize(rpId, canonicalOrigin)
}

/** Reuse authorization only inside the ceremony and only for its exact RP ID. */
export const validateRpId = (
  requestedRpId: string | undefined,
  origin: PasskeyOrigin
): string => {
  const callerOrigin = getPasskeyOrigin(origin)
  const rpId = parseRpId(requestedRpId, callerOrigin)
  if (isSameDomain(rpId, callerOrigin)) return rpId
  if (origin instanceof RelatedOriginAuthorization && origin.rpId === rpId)
    return rpId
  throw mismatch()
}
