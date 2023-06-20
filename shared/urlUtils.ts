/**
 * Extracts the domain name and TLD from a URL
 *
 * @param url - The URL to extract the domain name and TLD from
 * @returns URL object or URL-like object with null values
 */
export const getDomainNameAndTldFromUrl = (url: string) => {
  const host = constructURL(url).hostname
  if (!host) {
    return null
  }
  const parts = host.split('.')
  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
}

/**
 * Constructs a URL object from a string, adding https:// if needed so that users can omit the protocol when saving a secret
 * @returns URL object
 */
export const constructURL = (url: string) => {
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
