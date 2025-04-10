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

  // Helper function to strip subdomains
  const stripSubdomains = (hostname: string): string[] => {
    const parts = hostname.split('.')
    const stripped = [] as string[]
    while (parts.length > 2) {
      parts.shift()
      stripped.push(parts.join('.'))
    }
    stripped.push(parts.join('.')) // include the original hostname without modification
    return stripped
  }

  const hostnamesToCheck = stripSubdomains(hostname)

  for (const host of hostnamesToCheck) {
    const partialMatch = webInputs.filter((i) => i.url.includes(host)) ?? []
    if (partialMatch.length > 0) {
      return partialMatch
    }
  }

  return []
}

export const getWebInputsForUrlOfKinds = (
  url: string,
  kinds: WebInputType[]
) => {
  return getWebInputsForUrl(url).filter((i) => kinds.includes(i.kind))
}
