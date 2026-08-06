import debug from 'debug'

const log = debug('au:classifyPasswordForm')

export enum PasswordFormKind {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  UNKNOWN = 'UNKNOWN'
}

export type PasswordFormConfidence = 'high' | 'low'

export interface PasswordFormClassification {
  kind: PasswordFormKind
  confidence: PasswordFormConfidence
  /** the form, or the nearest ancestor that holds the credential inputs */
  scope: HTMLElement
  /** the field holding the user's existing password - the only one safe to autofill */
  currentPasswordInput: HTMLInputElement | null
  /** fields meant to receive a brand new password - never autofill a stored password here */
  newPasswordInputs: HTMLInputElement[]
  usernameInput: HTMLInputElement | null
  /** every signal that contributed, for debugging */
  signals: string[]
}

const LOGIN_URL_RE =
  /(login|log-in|signin|sign-in|\bauth\b|session|sso|oauth|u\/login)/i
const SETTINGS_URL_RE =
  /(settings|account|profile|preferences|security|change-?password|user\/edit|manage|admin)/i
const LOGOUT_HREF_RE = /(logout|log-out|signout|sign-out|session\/end)/i
const LOGIN_FORM_ATTR_RE = /(login|signin|session)/i

// tier 2b - visible copy, english only
const LOGOUT_TEXT_RE = /\b(log ?out|sign ?out)\b/i
const CHANGE_PASSWORD_HEADING_RE = /(change|update).*password/i
const SAVE_BUTTON_TEXT_RE = /\b(save|update|change)\b/i
const LOGIN_BUTTON_TEXT_RE = /\b(log ?in|sign ?in|continue)\b/i

/** inputs that sit next to a login form but are never the username */
const NON_USERNAME_INPUT_RE =
  /(search|query|coupon|promo|zip|postal|phone|card)/i

/** the only input types a username or email can realistically live in */
const USERNAME_CAPABLE_TYPES = ['text', 'email', 'tel', 'url', 'number']

const MAX_SCOPE_WALK_DEPTH = 6
const MAX_CLICKABLE_SCAN = 500

/**
 * Reads the page language per the `lang` global attribute. An absent or empty
 * `lang` means "unknown" per the HTML spec, and unknown is not english - we would
 * rather give up on autofill than score english keywords against a page that
 * isn't in english.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang
 */
const readPrimaryLanguageSubtag = (doc: Document): string => {
  const lang = (doc.documentElement?.getAttribute('lang') ?? '')
    .trim()
    .toLowerCase()
  return lang.split('-')[0]
}

let cachedEnglishCheck: { href: string; isEnglish: boolean } | null = null

export const isEnglishPage = (): boolean => {
  const href = typeof location === 'undefined' ? '' : location.href
  if (cachedEnglishCheck && cachedEnglishCheck.href === href) {
    return cachedEnglishCheck.isEnglish
  }

  let subtag = readPrimaryLanguageSubtag(document)

  // the content script runs in all frames, and an embedded login iframe often
  // ships a bare <html> while the top frame declares its language
  if (!subtag && window.top && window.top !== window.self) {
    try {
      const topDocument = window.top.document
      if (topDocument) {
        subtag = readPrimaryLanguageSubtag(topDocument)
      }
    } catch (err) {
      // cross-origin top frame, we simply stay in the non-english path
      log('could not read top frame lang', err)
    }
  }

  const isEnglish = subtag === 'en'
  cachedEnglishCheck = { href, isEnglish }
  return isEnglish
}

/** only exported for tests - clears the per-URL memo */
export const resetLanguageCache = () => {
  cachedEnglishCheck = null
}

const getAutocomplete = (el: HTMLInputElement) =>
  (el.getAttribute('autocomplete') ?? '').toLowerCase()

export const isNewPasswordInput = (el: HTMLInputElement) =>
  getAutocomplete(el).includes('new-password')

export const isCurrentPasswordInput = (el: HTMLInputElement) =>
  getAutocomplete(el).includes('current-password')

export const isPlausibleUsernameInput = (el: HTMLInputElement) => {
  if (USERNAME_CAPABLE_TYPES.includes(el.type) === false) {
    return false
  }
  if (el.readOnly || el.disabled) {
    return false
  }
  // a single character box is an OTP digit or similar, never a username
  if (el.maxLength === 1 || el.maxLength === 2) {
    return false
  }
  const haystack = [
    el.getAttribute('name'),
    el.getAttribute('id'),
    el.getAttribute('placeholder'),
    el.getAttribute('aria-label')
  ]
    .filter(Boolean)
    .join(' ')

  return NON_USERNAME_INPUT_RE.test(haystack) === false
}

const looksLikeUsernameField = (el: HTMLInputElement) => {
  const autocomplete = getAutocomplete(el)
  return (
    el.type === 'email' ||
    el.getAttribute('inputmode') === 'email' ||
    autocomplete.includes('username') ||
    autocomplete.includes('email')
  )
}

/**
 * Walks up from the password input to the element that holds the whole credential
 * form. Prefers a real <form>, but plenty of sites ship none, so we fall back to
 * the nearest ancestor holding more than just the password field.
 */
export const resolveFormScope = (
  passwordInput: HTMLInputElement
): HTMLElement => {
  if (passwordInput.form) {
    return passwordInput.form
  }

  let candidate: HTMLElement | null = passwordInput.parentElement
  let depth = 0
  while (candidate && depth < MAX_SCOPE_WALK_DEPTH) {
    if (candidate.querySelectorAll('input').length >= 2) {
      return candidate
    }
    candidate = candidate.parentElement
    depth++
  }

  return document.body
}

const getScopedInputs = (scope: HTMLElement): HTMLInputElement[] => {
  const inScope = Array.from(
    scope.querySelectorAll('input')
  ) as HTMLInputElement[]
  return inScope.filter((el) => el.type !== 'hidden')
}

const getSubmitElementText = (scope: HTMLElement): string => {
  const submitEl = scope.querySelector(
    'button[type="submit"], input[type="submit"], button:not([type]), [role="button"]'
  )
  if (!submitEl) {
    return ''
  }
  if (submitEl instanceof HTMLInputElement) {
    return submitEl.value ?? ''
  }
  return submitEl.textContent?.trim() ?? ''
}

const getScopeHeadingText = (scope: HTMLElement): string => {
  const headings = Array.from(scope.querySelectorAll('h1, h2, h3, legend'))
  if (headings.length > 0) {
    return headings.map((el) => el.textContent?.trim() ?? '').join(' ')
  }
  // change-password widgets often keep the heading just outside the form
  const parentHeadings = Array.from(
    scope.parentElement?.querySelectorAll('h1, h2, h3, legend') ?? []
  )
  return parentHeadings.map((el) => el.textContent?.trim() ?? '').join(' ')
}

const hasLogoutHref = () =>
  Array.from(document.querySelectorAll('a[href]')).some((el) =>
    LOGOUT_HREF_RE.test(el.getAttribute('href') ?? '')
  )

const hasLogoutText = () => {
  const clickables = Array.from(
    document.querySelectorAll(
      'a, button, [role="button"], [role="menuitem"], [role="link"]'
    )
  ).slice(0, MAX_CLICKABLE_SCAN)

  return clickables.some((el) =>
    LOGOUT_TEXT_RE.test(el.textContent?.trim() ?? '')
  )
}

const buildClassification = (
  kind: PasswordFormKind,
  confidence: PasswordFormConfidence,
  parts: Omit<PasswordFormClassification, 'kind' | 'confidence' | 'signals'> & {
    signals: string[]
  }
): PasswordFormClassification => {
  const classification = { kind, confidence, ...parts }
  log('classified', kind, confidence, parts.signals)
  return classification
}

/**
 * Decides whether the form around `passwordInput` is a login form, a signup form
 * or a change-password form, so autofill never types a stored password into a
 * "new password" field and never rewrites a settings page.
 */
export const classifyPasswordForm = (
  passwordInput: HTMLInputElement
): PasswordFormClassification => {
  const scope = resolveFormScope(passwordInput)
  const scopedInputs = getScopedInputs(scope)
  const passwordInputs = scopedInputs.filter((el) => el.type === 'password')

  const newPasswordInputs = passwordInputs.filter(isNewPasswordInput)
  const currentPasswordInputs = passwordInputs.filter(isCurrentPasswordInput)
  const usernameCandidates = scopedInputs.filter(
    (el) => el.type !== 'password' && isPlausibleUsernameInput(el)
  )
  const usernameInput =
    usernameCandidates.find(looksLikeUsernameField) ??
    usernameCandidates[0] ??
    null

  const base = {
    scope,
    usernameInput,
    currentPasswordInput:
      currentPasswordInputs[0] ??
      passwordInputs.find((el) => isNewPasswordInput(el) === false) ??
      null,
    newPasswordInputs
  }

  // TIER 1 - autocomplete values are spec defined, identical in every language
  if (newPasswordInputs.length > 0) {
    if (currentPasswordInputs.length > 0) {
      return buildClassification(PasswordFormKind.CHANGE_PASSWORD, 'high', {
        ...base,
        currentPasswordInput: currentPasswordInputs[0],
        signals: ['tier1:new-password+current-password']
      })
    }
    return buildClassification(PasswordFormKind.SIGNUP, 'high', {
      ...base,
      currentPasswordInput: null,
      signals: ['tier1:new-password-without-current-password']
    })
  }

  if (currentPasswordInputs.length === 1) {
    return buildClassification(PasswordFormKind.LOGIN, 'high', {
      ...base,
      currentPasswordInput: currentPasswordInputs[0],
      signals: ['tier1:single-current-password']
    })
  }

  if (passwordInputs.length >= 3) {
    return buildClassification(PasswordFormKind.CHANGE_PASSWORD, 'high', {
      ...base,
      currentPasswordInput: passwordInputs[0],
      newPasswordInputs: passwordInputs.slice(1),
      signals: ['tier1:three-or-more-password-inputs']
    })
  }

  // TIER 2a - structural signals, safe in any language
  const signals: string[] = []
  let score = 0
  const addSignal = (delta: number, name: string) => {
    score += delta
    signals.push(`${name}:${delta > 0 ? '+' : ''}${delta}`)
  }

  if (hasLogoutHref()) {
    addSignal(-3, '2a:logout-href')
  }

  const path = `${location.pathname}${location.search}`
  if (LOGIN_URL_RE.test(path)) {
    addSignal(3, '2a:login-url')
  }
  if (SETTINGS_URL_RE.test(path)) {
    addSignal(-2, '2a:settings-url')
  }

  const formAttrs = [
    scope.getAttribute('action'),
    scope.getAttribute('id'),
    scope.getAttribute('class'),
    scope.getAttribute('name')
  ]
    .filter(Boolean)
    .join(' ')
  if (LOGIN_FORM_ATTR_RE.test(formAttrs)) {
    addSignal(2, '2a:login-form-attrs')
  }

  if (passwordInputs.length === 1) {
    addSignal(1, '2a:single-password-input')
  } else if (passwordInputs.length === 2) {
    addSignal(-1, '2a:two-password-inputs')
  }

  const editableUsername = usernameCandidates.find(
    (el) => el.value === '' && looksLikeUsernameField(el)
  )
  const lockedUsername = scopedInputs.find(
    (el) =>
      el.type !== 'password' &&
      (el.readOnly || el.disabled || el.value !== '') &&
      (looksLikeUsernameField(el) || el.type === 'text')
  )

  if (editableUsername) {
    addSignal(2, '2a:empty-editable-username')
  } else if (lockedUsername) {
    addSignal(-2, '2a:locked-or-prefilled-username')
  } else if (usernameCandidates.length === 0) {
    addSignal(-1, '2a:no-username-candidate')
  }

  // TIER 2b - visible copy, english pages only
  const englishPage = isEnglishPage()
  if (englishPage) {
    if (hasLogoutText()) {
      addSignal(-3, '2b:logout-text')
    }
    if (CHANGE_PASSWORD_HEADING_RE.test(getScopeHeadingText(scope))) {
      addSignal(-3, '2b:change-password-heading')
    }
    const submitText = getSubmitElementText(scope)
    if (LOGIN_BUTTON_TEXT_RE.test(submitText)) {
      addSignal(2, '2b:login-submit-text')
    } else if (SAVE_BUTTON_TEXT_RE.test(submitText)) {
      addSignal(-2, '2b:save-submit-text')
    }
  } else {
    signals.push('2b:skipped-non-english')
  }

  /**
   * without tier 1 attributes a non-english page only ever gets structural
   * signals, so it may gate a fill but must never gate an auto-submit
   */
  const capConfidence = (confidence: PasswordFormConfidence) =>
    englishPage ? confidence : 'low'

  if (score >= 2) {
    return buildClassification(
      PasswordFormKind.LOGIN,
      capConfidence(score >= 4 ? 'high' : 'low'),
      { ...base, signals }
    )
  }

  if (score <= -2) {
    // no field is meant to hold an existing password, so this is a signup form
    const kind =
      base.currentPasswordInput === null
        ? PasswordFormKind.SIGNUP
        : PasswordFormKind.CHANGE_PASSWORD

    return buildClassification(
      kind,
      capConfidence(score <= -4 ? 'high' : 'low'),
      {
        ...base,
        newPasswordInputs:
          newPasswordInputs.length > 0
            ? newPasswordInputs
            : passwordInputs.filter((el) => el !== base.currentPasswordInput),
        signals
      }
    )
  }

  return buildClassification(PasswordFormKind.UNKNOWN, 'low', {
    ...base,
    signals
  })
}

/**
 * Page level entry point - classifies the form around the first password input of
 * `usefulInputs` (the list callers already built with `filterUselessInputs`). When
 * the page has no password input at all - step 1 of a multi step login - we treat
 * it as a login page, since there is nothing a stored password could overwrite.
 */
export const classifyPageForAutofill = (
  usefulInputs: HTMLInputElement[],
  scopeFallback: HTMLElement = document.body
): PasswordFormClassification => {
  const passwordInput = usefulInputs.find((el) => el.type === 'password')

  if (passwordInput) {
    return classifyPasswordForm(passwordInput)
  }

  const usernameInput =
    usefulInputs
      .filter(isPlausibleUsernameInput)
      .find(looksLikeUsernameField) ?? null

  return buildClassification(PasswordFormKind.LOGIN, 'low', {
    scope: scopeFallback,
    currentPasswordInput: null,
    newPasswordInputs: [],
    usernameInput,
    signals: ['no-password-input-on-page']
  })
}
