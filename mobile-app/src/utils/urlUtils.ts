import { URL } from 'react-native-url-polyfill'

/**
 * Constructs a URL object from a string, adding https:// if needed.
 * @param url
 * @returns URL object or URL-like object with null values
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
      origin: null,
      pathname: null,
      port: null
    }
  }
}
