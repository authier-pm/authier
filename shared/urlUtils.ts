/**
 * Extracts the domain name and TLD from a URL
 *
 * @param url - The URL to extract the domain name and TLD from
 * @returns The domain name and TLD from the URL
 */
export const getDomainNameAndTldFromUrl = (url: string) => {
  const host = new URL(url ?? '').hostname
  const parts = host.split('.')
  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
}
