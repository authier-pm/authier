// Authentication context distinguishes short codes from order numbers and dates.
const contextPattern =
  /\b(?:(?:verification|security|confirmation|authentication|authorization|login|log[ -]?in|sign[ -]?in|access|email|launch|one[ -]?time)\s+(?:verification\s+)?(?:code|password|passcode|pin)|otp|passcode|(?:verify|confirm)\s+your\s+(?:email|account|identity))\b/gi
const authenticationPattern =
  /\b(?:verif(?:y|ication)|authenticat(?:e|ion)|log[ -]?in|sign(?:ing)?[ -]?in|one[ -]?time|two[ -]?factor|2fa)\b/i
const ordinaryWords = new Set([
  'A',
  'AN',
  'AND',
  'ARE',
  'AS',
  'AT',
  'BE',
  'BY',
  'CAN',
  'CODE',
  'COPY',
  'DO',
  'FOR',
  'FROM',
  'HAS',
  'HERE',
  'HI',
  'HOW',
  'IF',
  'IN',
  'IS',
  'IT',
  'NOT',
  'NOW',
  'OF',
  'ON',
  'OR',
  'OUR',
  'THE',
  'THIS',
  'TO',
  'USE',
  'WAS',
  'WE',
  'WILL',
  'WITH',
  'YOU',
  'YOUR',
  'ACCOUNT',
  'ADDRESS',
  'CONFIRM',
  'CONTACT',
  'CONTINUE',
  'DEAR',
  'EMAIL',
  'ENTER',
  'EXAMPLE',
  'EXPIRES',
  'HELLO',
  'IGNORE',
  'INVALID',
  'MINUTES',
  'ORDER',
  'PLEASE',
  'REGARDS',
  'REQUEST',
  'SECURITY',
  'SIGNIN',
  'SUPPORT',
  'THANKS',
  'VERIFY',
  'WARNING',
  'WELCOME'
])

const normalizeEmailText = (text: string) =>
  text
    .slice(0, 32_000)
    .normalize('NFKC')
    // Soft hyphens, zero-width characters and bidi formatting are not code digits.
    .replace(/[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n(?: *\n)+/g, '\n')
    // Ignore URLs and email addresses, including codes embedded in query strings.
    .replace(/(?:https?:\/\/|www\.)\S+|[^\s@]+@[^\s@]+\.[^\s@]+/gi, (match) =>
      ' '.repeat(match.length)
    )

type CodeCandidate = { code: string; start: number; end: number }
type CodeToken = { value: string; start: number; end: number }

const hasCodeBoundaries = (text: string, { start, end }: CodeCandidate) =>
  !/[\p{L}\p{N}@._/=+-]/u.test(text[start - 1] ?? '') &&
  !/^[\p{L}\p{N}@_/=+-]|^\.[\p{L}\p{N}]/u.test(text.slice(end, end + 2))

const isDuration = (text: string, end: number) =>
  /^\s*(?:seconds?|secs?|minutes?|mins?|hours?|hrs?|days?)\b/i.test(
    text.slice(end)
  )

const getCandidates = (text: string): CodeCandidate[] => {
  const tokens = [...text.matchAll(/[a-zA-Z0-9]+/g)].map((match) => ({
    value: match[0],
    start: match.index,
    end: match.index + match[0].length
  }))
  const candidates: CodeCandidate[] = []
  const add = (candidate: CodeCandidate) => {
    if (
      candidate.code.length < 6 ||
      candidate.code.length > 8 ||
      ordinaryWords.has(candidate.code.toUpperCase()) ||
      !hasCodeBoundaries(text, candidate)
    )
      return
    const prefix = text.slice(
      Math.max(0, candidate.start - 40),
      candidate.start
    )
    if (
      /\b(?:call|phone|order|invoice|reference|ticket|tracking)\s*(?:number|id)?\s*(?:is\s*)?[:#]?\s*$/i.test(
        prefix
      )
    )
      return
    candidates.push(candidate)
  }
  const isFragment = ({ value, end }: CodeToken) => {
    if (/^\d+$/.test(value)) return !isDuration(text, end)
    return (
      value.length <= 4 &&
      (value.length === 1 || !ordinaryWords.has(value.toUpperCase()))
    )
  }

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (!isFragment(token)) {
      add({ code: token.value, start: token.start, end: token.end })
      continue
    }
    let code = token.value
    let end = token.end
    // Reassemble split characters and groups. Consume the whole numeric
    // run so a nine-digit formatted number cannot become a six-digit code.
    while (index + 1 < tokens.length) {
      const next = tokens[index + 1]
      const separator = text.slice(end, next.start)
      if (!isFragment(next) || !/^[\s\-·•]+$/.test(separator)) break
      // A complete numeric code followed by prose must stay separate. Numeric
      // groups can have any length, including an uneven split such as 12345 678.
      if (
        /^\d{6,8}$/.test(code) &&
        /^[a-zA-Z]{2,}$/.test(next.value) &&
        /^\s+$/.test(separator)
      )
        break
      code += next.value
      end = next.end
      index++
    }
    add({ code, start: token.start, end })
  }
  return candidates
}

const looksLikeCode = (candidate: CodeCandidate) =>
  /\d/.test(candidate.code) || /^[A-Z]{6,8}$/.test(candidate.code)

const isStandaloneLine = (text: string, candidate: CodeCandidate) => {
  const lineStart = text.lastIndexOf('\n', candidate.start - 1) + 1
  const nextLine = text.indexOf('\n', candidate.end)
  const lineEnd = nextLine === -1 ? text.length : nextLine
  return (
    !text.slice(lineStart, candidate.start).trim() &&
    !text.slice(candidate.end, lineEnd).trim()
  )
}

export const extractVerificationCode = (
  body: string,
  subject = ''
): string | null => {
  const text = normalizeEmailText(body)
  const normalizedSubject = normalizeEmailText(subject)
  const contexts = [...text.matchAll(contextPattern)]
  // Templates also say "Use this code to sign in" rather than "sign-in code".
  if (authenticationPattern.test(`${normalizedSubject}\n${text}`)) {
    contexts.push(
      ...[...text.matchAll(/\b(?:code|pin)\b/gi)].filter(
        (match) =>
          !/\b(?:discount|promo|coupon|gift|postal|zip|referral|tracking|order)\s*$/i.test(
            text.slice(Math.max(0, match.index - 25), match.index)
          )
      )
    )
  }
  const candidates = getCandidates(text)
  const ranked = candidates
    .flatMap((candidate) => {
      const distances = contexts.map((context) => {
        const contextEnd = context.index + context[0].length
        if (candidate.start >= contextEnd) {
          const gap = text.slice(contextEnd, candidate.start)
          const explicitLabel = /^\s*(?:is\s*)?[:=]\s*$/i.test(gap)
          const separateCodeLine =
            /\n/.test(gap) &&
            /^\s*(?:is\s*)?[:=]?\s*$/i.test(gap) &&
            isStandaloneLine(text, candidate)
          return looksLikeCode(candidate) || explicitLabel || separateCodeLine
            ? candidate.start - contextEnd
            : Infinity
        }
        if (candidate.end <= context.index && looksLikeCode(candidate))
          return context.index - candidate.end
        return Infinity
      })
      const distance = Math.min(...distances)
      return distance <= 80 ? [{ code: candidate.code, distance }] : []
    })
    .sort((a, b) => a.distance - b.distance)

  if (ranked.length) {
    if (
      ranked[1]?.distance === ranked[0].distance &&
      ranked[1].code !== ranked[0].code
    )
      return null
    return ranked[0].code
  }
  // A subject can supply the context when the body has a single plausible code.
  const standaloneCodes = candidates.filter(looksLikeCode)
  if (
    ([...normalizedSubject.matchAll(contextPattern)].length ||
      authenticationPattern.test(normalizedSubject)) &&
    standaloneCodes.length === 1
  ) {
    return standaloneCodes[0].code
  }
  return null
}
