import { constructURL } from './urlUtils'

export const parseAutofillForbiddenUrlPatterns = (value: string): string[] => {
  const patterns = value
    .split(/\r?\n/)
    .map((pattern) => pattern.trim())
    .filter(Boolean)

  return [...new Set(patterns)]
}

export const serializeAutofillForbiddenUrlPatterns = (value: string): string =>
  parseAutofillForbiddenUrlPatterns(value).join('\n')

const urlPatternToRegExp = (pattern: string): RegExp => {
  const escapedPattern = pattern
    .replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')

  return new RegExp(`^${escapedPattern}$`)
}

export const isAutofillForbiddenForUrl = (
  url: string,
  forbiddenUrlPatterns: string
): boolean => {
  const parsedUrl = constructURL(url)

  if (!parsedUrl.href) {
    return false
  }

  const normalizedUrl = new URL(parsedUrl.href)
  const urlWithoutProtocol = `${normalizedUrl.host}${normalizedUrl.pathname}${normalizedUrl.search}${normalizedUrl.hash}`

  return parseAutofillForbiddenUrlPatterns(forbiddenUrlPatterns).some(
    (pattern) => {
      const candidateUrl = pattern.includes('://')
        ? normalizedUrl.href
        : urlWithoutProtocol

      return urlPatternToRegExp(pattern).test(candidateUrl)
    }
  )
}
