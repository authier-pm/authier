// Authentication context distinguishes short codes from order numbers and dates.
// android-app/.../SmsCodeExtractor.kt ports the SMS mode; keep both in sync with
// shared/smsVerificationCodeVectors.json.
const contextPattern =
  /\b(?:(?:verification|security|confirmation|authentication|authorization|login|log[ -]?in|sign[ -]?in|access|email|launch|one[ -]?time)\s+(?:verification\s+)?(?:code|password|passcode|pin)|otp|passcode|(?:verify|confirm)\s+your\s+(?:email|account|identity))\b/gi
const authenticationPattern =
  /\b(?:verif(?:y|ication)|authenticat(?:e|ion)|log[ -]?in|sign(?:ing)?[ -]?in|one[ -]?time|two[ -]?factor|2fa)\b/i
// SMS templates are short and often localized, so a code word is enough context.
const smsCodeWordPattern =
  /(?<![\p{L}\p{N}])(?:codes?|kódu?|kodu?|kódem|kodem|código|codigo|codice|cod(?:ul)?|kode|koodi|kood|kods|kodas|kodunuz|κωδικός|код[ау]?|кодом|bestätigungscode|sicherheitscode|anmeldecode|zugangscode|freigabecode|verificatiecode|beveiligingscode|inlogcode|verifieringskod|säkerhetskod|engångskod|engangskode|pin|otp|m-?tan|tan|passcode|heslo|hesla|passwort|kennwort|contraseña|senha|parola|hasło|haslo|jelszó|wachtwoord|пароль|şifre|sifre)(?![\p{L}\p{N}])/giu
const promotionalPattern =
  /%|\b(?:sale|discount|promo|coupon|voucher|sleva|slevu|rabatt|gutschein|descuento|cupón|réduction|sconto)\b/i
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

/** Emails use 6–8 characters. SMS codes are 4–8 characters with at least one digit. */
export type VerificationCodeFormat = 'email' | 'sms'

const normalizeMessageText = (text: string) =>
  text
    .slice(0, 32_000)
    .normalize('NFKC')
    // Soft hyphens, zero-width characters and bidi formatting are not code digits.
    .replace(/[­​-‏‪-‮⁠-⁯﻿]/g, '')
    .replace(/[‐-―−]/g, '-')
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n(?: *\n)+/g, '\n')
    // Ignore URLs and email addresses, including codes embedded in query strings.
    // Addresses only start a run of text, so long runs cannot backtrack quadratically.
    .replace(
      /(?:https?:\/\/|www\.)\S+|(?<![^\s@])[^\s@]+@[^\s@]+\.[^\s@]+/gi,
      (match) => ' '.repeat(match.length)
    )

type CodeCandidate = { code: string; start: number; end: number }
type CodeToken = { value: string; start: number; end: number }

const wordPattern = /^[a-zA-Z]{2,}$/
const numberPattern = /^\d+$/

/** Whether two adjacent fragments belong to different words or numbers. */
const endsGroup = (
  code: string,
  next: string,
  separator: string,
  format: VerificationCodeFormat
) => {
  if (/^\s+$/.test(separator)) {
    // A complete numeric code followed by prose must stay separate. Numeric
    // groups can have any length, including an uneven split such as 12345 678.
    if (/^\d{6,8}$/.test(code) && wordPattern.test(next)) return true
    // Short SMS words ("je", "CZK") must never join an adjacent number.
    if (
      format === 'sms' &&
      ((numberPattern.test(code) && wordPattern.test(next)) ||
        (wordPattern.test(code) && numberPattern.test(next)))
    )
      return true
  }
  return (
    format === 'sms' &&
    separator === '-' &&
    /^[A-Z]{1,3}$/.test(code) &&
    /^\d{4,8}$/.test(next)
  )
}

// SMS senders often prefix the code with their initials, as in G-123456.
const hasSenderPrefix = (text: string, start: number) =>
  /(?<![\p{L}\p{N}])[A-Z]{1,3}-$/u.test(
    text.slice(Math.max(0, start - 5), start)
  )

const hasCodeBoundaries = (
  text: string,
  { start, end }: CodeCandidate,
  format: VerificationCodeFormat
) =>
  (!/[\p{L}\p{N}@._/=+-]/u.test(text[start - 1] ?? '') ||
    (format === 'sms' && hasSenderPrefix(text, start))) &&
  !/^[\p{L}\p{N}@_/=+-]|^\.[\p{L}\p{N}]/u.test(text.slice(end, end + 2))

// Normalized whitespace is short, so a small window holds the whole unit.
const isDuration = (text: string, end: number) =>
  /^\s*(?:seconds?|secs?|minutes?|mins?|hours?|hrs?|days?)\b/i.test(
    text.slice(end, end + 24)
  )

// Payment confirmations put amounts and masked card numbers next to the code.
const isAmountOrCard = (text: string, { code, start, end }: CodeCandidate) =>
  /^(?:[.,]\d{1,2})? ?(?:czk|kč|kc|eur|usd|gbp|pln|zł|huf|ft|chf|sek|nok|dkk|ron|lei|bgn|uah|rub|inr|jpy|cny|aud|cad|[€$£¥₹₽])(?![\p{L}\p{N}])/iu.test(
    text.slice(end, end + 8)
  ) ||
  /(?:[€$£¥₹₽*•]|\b(?:czk|eur|usd|gbp|pln|chf)) ?$/i.test(
    text.slice(Math.max(0, start - 5), start)
  ) ||
  /^x{2,}\d+$/i.test(code)

// A footer's "street, city, CA 94107" must not become the code "CA94107".
// Keep the surrounding address evidence so real codes such as "CA 94107"
// remain eligible when they follow a code label instead.
const isPostalAddress = (text: string, { start, end }: CodeCandidate) =>
  /^[A-Z]{2}\s*\d{5}$/.test(text.slice(start, end)) &&
  /,\s*[\p{L}][\p{L} .'’-]*,\s*$/u.test(
    text.slice(Math.max(0, start - 120), start)
  )

const hasValidLength = (code: string, format: VerificationCodeFormat) => {
  if (!/^[a-zA-Z0-9]+$/.test(code)) return false
  if (format === 'email') return code.length >= 6 && code.length <= 8
  if (!/\d/.test(code)) return false
  return code.length >= 6
    ? code.length <= 8
    : code.length >= 4 && /^[A-Z0-9]+$/.test(code)
}

const getCandidates = (
  text: string,
  format: VerificationCodeFormat
): CodeCandidate[] => {
  // Unicode words stay whole, so "platí" cannot yield the fragment "plat".
  const tokens = [...text.matchAll(/[\p{L}\p{N}]+/gu)].map((match) => ({
    value: match[0],
    start: match.index,
    end: match.index + match[0].length
  }))
  const candidates: CodeCandidate[] = []
  const add = (candidate: CodeCandidate) => {
    if (
      !hasValidLength(candidate.code, format) ||
      ordinaryWords.has(candidate.code.toUpperCase()) ||
      !hasCodeBoundaries(text, candidate, format) ||
      isAmountOrCard(text, candidate) ||
      (format === 'email' && isPostalAddress(text, candidate))
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
    if (numberPattern.test(value)) return !isDuration(text, end)
    return (
      value.length <= 4 &&
      /^[a-zA-Z0-9]+$/.test(value) &&
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
      if (
        !isFragment(next) ||
        !/^[\s\-·•]+$/.test(separator) ||
        endsGroup(code, next.value, separator, format)
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

const looksLikeCode = (
  candidate: CodeCandidate,
  format: VerificationCodeFormat
) =>
  /\d/.test(candidate.code) ||
  (format === 'email' && /^[A-Z]{6,8}$/.test(candidate.code))

const isStandaloneLine = (text: string, candidate: CodeCandidate) => {
  const lineStart = text.lastIndexOf('\n', candidate.start - 1) + 1
  const nextLine = text.indexOf('\n', candidate.end)
  const lineEnd = nextLine === -1 ? text.length : nextLine
  return (
    !text.slice(lineStart, candidate.start).trim() &&
    !text.slice(candidate.end, lineEnd).trim()
  )
}

const isGenericCodeContext = (text: string, match: RegExpExecArray) =>
  !/\b(?:discount|promo|coupon|gift|postal|zip|referral|tracking|order)\s*$/i.test(
    text.slice(Math.max(0, match.index - 25), match.index)
  )

const getContexts = (
  text: string,
  subject: string,
  format: VerificationCodeFormat
) => {
  const contexts = [...text.matchAll(contextPattern)]
  if (format === 'sms') {
    if (!promotionalPattern.test(text))
      contexts.push(
        ...[...text.matchAll(smsCodeWordPattern)].filter((match) =>
          isGenericCodeContext(text, match)
        )
      )
  } else if (authenticationPattern.test(`${subject}\n${text}`)) {
    // Templates also say "Use this code to sign in" rather than "sign-in code".
    contexts.push(
      ...[...text.matchAll(/\b(?:code|pin)\b/gi)].filter((match) =>
        isGenericCodeContext(text, match)
      )
    )
  }
  return contexts
}

export const extractVerificationCode = (
  body: string,
  subject = '',
  format: VerificationCodeFormat = 'email'
): string | null => {
  const text = normalizeMessageText(body)
  const normalizedSubject = normalizeMessageText(subject)
  const contexts = getContexts(text, normalizedSubject, format)
  const candidates = getCandidates(text, format)
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
          return looksLikeCode(candidate, format) ||
            explicitLabel ||
            separateCodeLine
            ? candidate.start - contextEnd
            : Infinity
        }
        if (candidate.end <= context.index && looksLikeCode(candidate, format))
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
  const standaloneCodes = candidates.filter((candidate) =>
    looksLikeCode(candidate, format)
  )
  if (
    ([...normalizedSubject.matchAll(contextPattern)].length ||
      authenticationPattern.test(normalizedSubject)) &&
    standaloneCodes.length === 1
  ) {
    return standaloneCodes[0].code
  }
  return null
}

export const extractSmsVerificationCode = (text: string) =>
  extractVerificationCode(text, '', 'sms')
