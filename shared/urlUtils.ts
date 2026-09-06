import { getDomain } from 'tldts'

/** Registrable domain, including private suffixes such as github.io. */
export const getDomainNameAndTldFromUrl = (url: string) => {
  const host = constructURL(url).hostname
  return host ? getDomain(host, { allowPrivateDomains: true }) : null
}

export const matchesCredentialHost = (host: string, credentialUrl: string) => {
  const target = constructURL(host)
  const credential = constructURL(credentialUrl)
  if (!target.hostname || !credential.hostname) return false
  const domain = getDomainNameAndTldFromUrl(credentialUrl)
  if (!domain) return target.hostname === credential.hostname
  return target.hostname === domain || target.hostname.endsWith(`.${domain}`)
}

export type ConstructURLReturnType =
  | URL
  | {
      hostname: null
      href: null
      host: null
      origin: null
      pathname: null
      port: null
    }

/**
 * Constructs a URL object from a string, adding https:// if needed so that users can omit the protocol when saving a secret
 * @returns URL object
 */
export const constructURL = (url: string): ConstructURLReturnType => {
  try {
    if (!url.startsWith('http')) {
      return new URL(`https://${url}`)
    }
    return new URL(url)
  } catch (err) {
    return {
      // this is not a valid URL object, but that's ok for our needs,
      hostname: null,
      href: null,
      host: null,
      origin: null,
      pathname: null,
      port: null
    }
  }
}
