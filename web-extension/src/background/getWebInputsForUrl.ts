import { constructURL } from '@shared/urlUtils'
import { device } from './ExtensionDevice'
import { WebInputType } from '@shared/generated/graphqlBaseTypes'

export const getWebInputsForUrl = (url: string) => {
  const hostname = constructURL(url).hostname
  if (!hostname) {
    return []
  }

  const webInputs = device.state?.webInputs ?? []

  const exactMatch = webInputs.filter((i) => i.url === url) ?? []
  if (exactMatch.length > 0) {
    return exactMatch
  }

  // Hostname-bound match: a stored entry only applies to the same host or a
  // subdomain in either direction (parent learned selectors apply to
  // subdomains and vice versa). Never use substring matching here:
  // `'https://example.com/login'.includes('ample.com')` is true, so an
  // attacker domain like `ample.com` would receive another site's selectors.
  const isSameHostOrSubdomain = (visited: string, stored: string) =>
    visited === stored ||
    visited.endsWith(`.${stored}`) ||
    stored.endsWith(`.${visited}`)

  return webInputs.filter((i) => {
    const entryHostname = constructURL(i.url).hostname
    if (!entryHostname) return false
    return isSameHostOrSubdomain(hostname, entryHostname)
  })
}

export const getWebInputsForUrlOfKinds = (
  url: string,
  kinds: WebInputType[]
) => {
  return getWebInputsForUrl(url).filter((i) => kinds.includes(i.kind))
}
