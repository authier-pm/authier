import { URL } from 'react-native-url-polyfill'

/**
 * Constructs a URL object from a string, adding https:// if needed
 * @param url
 * @returns URL object
 */
export const constructURL = (url: string) => {
  if (!url.startsWith('http')) {
    return new URL(`https://${url}`)
  }
  return new URL(url)
}
