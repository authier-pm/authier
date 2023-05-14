/**
 * Extracts the domain name and TLD from a URL
 *
 * @param url - The URL to extract the domain name and TLD from
 * @returns The domain name and TLD from the URL
 */
export const getDomainNameAndTldFromUrl = (url: string) => {
  const host = constructURL(url).hostname
  const parts = host.split('.')
  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
}

/**
 * Constructs a URL object from a string, adding https:// if needed so that users can omit the protocol when saving a secret
 * @param url
 * @returns URL object
 */
export const constructURL = (url: string) => {
  if (!url.startsWith('http')) {
    return new URL(`https://${url}`)
  }
  return new URL(url)
}
