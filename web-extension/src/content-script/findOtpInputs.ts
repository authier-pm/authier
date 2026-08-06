import debug from 'debug'

const log = debug('au:findOtpInputs')

/** TOTP codes are 6 digits, occasionally 8. Backup/SMS codes go as low as 4. */
const MIN_GROUP_SIZE = 4
const MAX_GROUP_SIZE = 8

/** a digit box is narrow by definition, same ceiling KeePassXC uses */
const MAX_BOX_WIDTH = 100

/** how far above the group we look for an "this is a 2FA widget" class or id */
const CONTAINER_LOOKUP_DEPTH = 3

const OTP_CONTAINER_RE =
  /(otp|2fa|two[-_]?factor|mfa|verif|one[-_]?time|passcode|security[-_]?code|auth[-_]?code|token[-_]?input)/i

/**
 * The per box aria labels these widgets use. Google says "code input 1 of 6",
 * Clerk's headless primitive says "Character 1 of 6", react-otp-input says
 * "Please enter OTP character 1".
 */
const ARIA_INDEX_RES = [
  /code input\s*(\d+)\s*of\s*(\d+)/i,
  /character\s*(\d+)\s*of\s*(\d+)/i,
  /otp character\s*(\d+)/i,
  /\bdigit\s*(\d+)/i
]

/** ids/names like otp-0, code_1, digit3, char-6 */
const INDEXED_NAME_RE = /^(.*?)(\d+)$/

const DIGIT_BOX_TYPES = ['text', 'tel', 'number', 'password']

/**
 * Sites put these on one-time-code fields to stop password managers stuffing a
 * password in. They are a positive signal that a field is an OTP field - Stripe,
 * Plaid and Bitfinex all set them.
 */
const PASSWORD_MANAGER_IGNORE_ATTRS = [
  'data-1p-ignore',
  'data-lpignore',
  'data-bwignore',
  'data-bw-ignore',
  'data-protonpass-ignore'
]

const ariaIndexOf = (el: HTMLInputElement): number | null => {
  const label = el.getAttribute('aria-label') ?? ''
  for (const re of ARIA_INDEX_RES) {
    const match = label.match(re)
    if (match) {
      return Number(match[1])
    }
  }
  return null
}

export interface SegmentedOtpGroup {
  inputs: HTMLInputElement[]
  /** why we believe this is a one-time-code widget, for debugging */
  signals: string[]
}

const attr = (el: Element, name: string) =>
  (el.getAttribute(name) ?? '').toLowerCase()

/**
 * Could this input be one box of a code widget? Deliberately permissive:
 * `maxlength=1` looks like the obvious gate but plenty of implementations skip
 * it (react-otp-input and vue-otp-input set none at all, Clerk's headless
 * primitive puts maxlength=6 on the first box and 1 on the rest so the browser
 * drops a whole SMS code into it). Uniformity within a container does the real
 * work; maxlength is demoted to a corroborating signal.
 */
const isDigitBoxCandidate = (el: HTMLInputElement) => {
  if (el.disabled || el.readOnly) {
    return false
  }
  // a digit box is always narrow; without this a row of ordinary fields can
  // pass every other check
  if (el.offsetWidth > MAX_BOX_WIDTH) {
    return false
  }
  return DIGIT_BOX_TYPES.includes(el.type)
}

/**
 * The box a widget wants the whole code in. Radix, Vuetify >=3.8 and Clerk's
 * headless primitive deliberately give exactly one box `maxlength=<full length>`
 * so a browser or password manager can drop the entire code in and let the
 * widget spread it across the rest. Writing once there avoids racing the
 * widget's own auto-advance.
 */
export const pickWholeCodeEntryBox = (
  inputs: HTMLInputElement[],
  codeLength: number
): HTMLInputElement | null => {
  const fullLengthBoxes = inputs.filter((el) => el.maxLength === codeLength)
  if (fullLengthBoxes.length === 1) {
    return fullLengthBoxes[0]
  }

  const advertised = inputs.filter((el) =>
    attr(el, 'autocomplete').includes('one-time-code')
  )
  if (advertised.length === 1) {
    return advertised[0]
  }

  return null
}

/** one character per box, however the site chose to express it */
const isSingleCharBox = (el: HTMLInputElement) =>
  el.maxLength === 1 ||
  el.maxLength === 2 ||
  (el.type === 'number' && attr(el, 'max') === '9')

/**
 * Boxes of one widget are rendered from the same loop, so they share type,
 * inputmode and class. This is what separates a code widget from a row of
 * unrelated fields that merely share a container.
 */
const isUniformGroup = (group: HTMLInputElement[]) => {
  const [first] = group
  return group.every(
    (el) =>
      el.type === first.type &&
      attr(el, 'inputmode') === attr(first, 'inputmode') &&
      el.className === first.className
  )
}

const isNumericish = (el: HTMLInputElement) => {
  const inputMode = attr(el, 'inputmode')
  const pattern = attr(el, 'pattern')
  return (
    el.type === 'number' ||
    el.type === 'tel' ||
    inputMode === 'numeric' ||
    inputMode === 'tel' ||
    inputMode === 'decimal' ||
    /\\d|\[0-9\]/.test(pattern)
  )
}

const lowestCommonAncestor = (elements: HTMLElement[]): HTMLElement | null => {
  if (elements.length === 0) {
    return null
  }

  let ancestor: HTMLElement | null = elements[0].parentElement
  while (ancestor) {
    if (elements.every((el) => ancestor!.contains(el))) {
      return ancestor
    }
    ancestor = ancestor.parentElement
  }

  return null
}

/**
 * The widget a box belongs to: the closest ancestor that holds more than one
 * digit box. Stopping at the *closest* such ancestor is what keeps two separate
 * widgets on one page apart - climbing higher would merge them at <body>.
 */
const groupRootFor = (
  box: HTMLInputElement,
  digitBoxes: Set<HTMLInputElement>
): HTMLElement | null => {
  let node = box.parentElement

  while (node) {
    const held = Array.from(node.querySelectorAll('input')).filter((el) =>
      digitBoxes.has(el as HTMLInputElement)
    )
    if (held.length >= 2) {
      return node
    }
    node = node.parentElement
  }

  return null
}

/**
 * Splits digit boxes into widgets. A group only counts when its container holds
 * those boxes and no other inputs, which is what separates a real OTP widget
 * from single-character fields that merely happen to share an ancestor.
 */
const groupByContainer = (
  digitBoxes: HTMLInputElement[]
): HTMLInputElement[][] => {
  const boxSet = new Set(digitBoxes)
  const byRoot = new Map<HTMLElement, HTMLInputElement[]>()

  for (const box of digitBoxes) {
    const root = groupRootFor(box, boxSet)
    if (!root) {
      continue
    }
    const existing = byRoot.get(root)
    if (existing) {
      existing.push(box)
    } else {
      byRoot.set(root, [box])
    }
  }

  return Array.from(byRoot.entries())
    .filter(
      ([root, group]) =>
        // no foreign inputs mixed in with the digit boxes
        root.querySelectorAll('input').length === group.length
    )
    .map(([, group]) => group)
}

/** ids like otp-0..otp-5 or code1..code6 - same prefix, consecutive numbers */
const hasSequentialNames = (inputs: HTMLInputElement[]) => {
  const parsed = inputs.map((el) => {
    const raw = el.id || el.getAttribute('name') || ''
    const match = raw.match(INDEXED_NAME_RE)
    return match ? { prefix: match[1], index: Number(match[2]) } : null
  })

  if (parsed.some((entry) => entry === null)) {
    return false
  }

  const entries = parsed as Array<{ prefix: string; index: number }>
  const prefix = entries[0].prefix
  if (entries.some((entry) => entry.prefix !== prefix)) {
    return false
  }

  return entries.every((entry, i) => entry.index === entries[0].index + i)
}

const hasOtpContainer = (inputs: HTMLInputElement[]) => {
  let node = lowestCommonAncestor(inputs)
  for (let depth = 0; node && depth < CONTAINER_LOOKUP_DEPTH; depth++) {
    if (
      OTP_CONTAINER_RE.test(node.className || '') ||
      OTP_CONTAINER_RE.test(node.id || '')
    ) {
      return true
    }
    node = node.parentElement
  }
  return false
}

/**
 * Orders a group by the index embedded in its ids, when there is one. React
 * components render in order so DOM order is normally right, but an explicit
 * index is authoritative when present.
 */
const orderGroup = (inputs: HTMLInputElement[]) => {
  const labelled = inputs
    .map((el) => {
      const index = ariaIndexOf(el)
      return index === null ? null : { el, index }
    })
    .filter(Boolean) as Array<{ el: HTMLInputElement; index: number }>

  if (labelled.length === inputs.length) {
    return labelled.sort((a, b) => a.index - b.index).map((entry) => entry.el)
  }

  return inputs
}

/**
 * Finds a segmented one-time-code widget - the row of single character boxes
 * sites use for 2FA. Keyed on structure rather than on any one site's markup,
 * because these widgets share almost no attributes across implementations:
 * Google labels them `aria-label="code input 1 of 6"` with `type=number`,
 * Bitfinex ships bare `type=text` boxes with only `inputmode=numeric` and
 * `maxlength=1`.
 *
 * @param usefulInputs visible, empty inputs, as produced by filterUselessInputs
 * @param expectedLength when known, only a group of exactly this size matches
 */
export const findSegmentedOtpInputs = (
  usefulInputs: HTMLInputElement[],
  expectedLength?: number
): SegmentedOtpGroup | null => {
  const digitBoxes = usefulInputs.filter(isDigitBoxCandidate)

  if (digitBoxes.length < MIN_GROUP_SIZE) {
    return null
  }

  const groups = groupByContainer(digitBoxes).filter(
    (group) =>
      group.length >= MIN_GROUP_SIZE &&
      group.length <= MAX_GROUP_SIZE &&
      isUniformGroup(group)
  )

  const matches: SegmentedOtpGroup[] = []

  for (const group of groups) {
    if (expectedLength !== undefined && group.length !== expectedLength) {
      log('skipping group, wrong size', {
        size: group.length,
        expectedLength
      })
      continue
    }

    const signals: string[] = []

    // Clerk puts maxlength=&lt;full length&gt; on the first box so a browser autofills
    // the whole code into it, so allow one box to differ
    const singleCharBoxes = group.filter(isSingleCharBox).length
    if (singleCharBoxes >= group.length - 1) {
      signals.push('single-char-boxes')
    }
    if (group.every(isNumericish)) {
      signals.push('numeric-boxes')
    }
    if (
      group.some((el) => attr(el, 'autocomplete').includes('one-time-code'))
    ) {
      signals.push('autocomplete-one-time-code')
    }
    if (group.every((el) => ariaIndexOf(el) !== null)) {
      signals.push('aria-indexed-boxes')
    }
    if (hasOtpContainer(group)) {
      signals.push('otp-container')
    }
    if (hasSequentialNames(group)) {
      signals.push('sequential-names')
    }
    // Radix marks every box *except* the active one, so require a majority
    // rather than all. Sites add these so password manager badges stop landing
    // on a digit box, which makes them a reliable "this is a code field" tell
    // rather than a reason to stay away.
    const ignoreMarked = group.filter((el) =>
      PASSWORD_MANAGER_IGNORE_ATTRS.some((name) => el.hasAttribute(name))
    ).length
    if (ignoreMarked > group.length / 2) {
      signals.push('password-manager-ignore-attrs')
    }

    /**
     * Single character boxes are the structural precondition, not evidence in
     * themselves - six bare `maxlength=1` fields could be a crossword. They set
     * how much corroboration we demand: a uniform run of them alone in a
     * container needs one more signal, anything looser needs two.
     */
    const isSingleCharShape = signals.includes('single-char-boxes')
    const corroborating = signals.filter(
      (signal) => signal !== 'single-char-boxes'
    )
    const required = isSingleCharShape ? 1 : 2

    if (corroborating.length >= required) {
      matches.push({ inputs: orderGroup(group), signals })
    } else {
      log('digit box group rejected, not enough corroboration', {
        size: group.length,
        signals,
        required
      })
    }
  }

  if (matches.length === 0) {
    return null
  }

  // most corroborated group wins, ties broken by the standard 6 digit length
  matches.sort((a, b) => {
    const bySignals = b.signals.length - a.signals.length
    if (bySignals !== 0) {
      return bySignals
    }
    return Number(b.inputs.length === 6) - Number(a.inputs.length === 6)
  })

  log('segmented OTP widget detected', {
    size: matches[0].inputs.length,
    signals: matches[0].signals,
    ids: matches[0].inputs.map((el) => el.id)
  })

  return matches[0]
}

export interface SingleOtpInput {
  input: HTMLInputElement
  signals: string[]
}

/** the widest a single OTP field gets - Microsoft allows 8, nobody allows 20 */
const MAX_SINGLE_FIELD_LENGTH = 10

/**
 * Vocabulary lifted from Bitwarden's autofill-constants, with separators made
 * optional - Auth0 ships `name="mfa_code"`, Okta `name="credentials.passcode"`.
 */
const STRONG_OTP_NAME_RE =
  /(2fa[-_ ]?code|approvals?[-_ ]?code|mfa[-_ ]?code|one[-_ ]?time[-_ ]?(code|password)|otc[-_ ]?code|otp[-_ ]?code|second[-_ ]?factor|totp|two[-_ ]?factor([-_ ]?code)?|multi[-_ ]?factor|verification[-_ ]?code|passcode|auth(entication)?[-_ ]?code)/i

const AMBIGUOUS_OTP_NAME_RE =
  /(\bcode\b|\bpin\b|\botc\b|\botp\b|\b2fa\b|\bmfa\b)/i

/**
 * A recovery code is not a TOTP and must never receive one. A card security
 * code is not one either - "security code" is what most checkout forms call the
 * CVV, which is why that phrase is disqualifying here rather than a signal.
 */
const RECOVERY_CODE_RE =
  /(backup|recovery|recover|\bcvv\b|\bcvc\b|\bcsc\b|card[-_ ]?(security|code)|security[-_ ]?code)/i

/** autocomplete values that prove the field is something else entirely */
const NON_OTP_AUTOCOMPLETE_RE =
  /(username|email|current-password|new-password|cc-|tel|address|name)/

/**
 * Everything a site might label a field with. `class` is included because Wise
 * ships `class="form-control plain-code-input"` and nothing else useful.
 */
const describeInput = (el: HTMLInputElement) =>
  [
    el.getAttribute('name'),
    el.getAttribute('id'),
    el.getAttribute('placeholder'),
    el.getAttribute('aria-label'),
    el.getAttribute('data-testid'),
    el.getAttribute('data-e2e'),
    el.className
  ]
    .filter(Boolean)
    .join(' ')

/**
 * Finds the plain single-field variant of a one-time-code input - the shape most
 * real sites actually ship, including every widget that paints fake digit boxes
 * over one real input (input-otp, Stripe, Shopify, Plaid).
 *
 * `autocomplete="one-time-code"` settles it on its own, but it is far from
 * universal: Okta downgrades it to `off` on desktop on purpose, Google sends
 * `off`, and Wise omits it. So a field also qualifies on a naming signal backed
 * by numeric input and a plausible length.
 *
 * @param usefulInputs visible, empty inputs, as produced by filterUselessInputs
 * @param codeLength length of the code we are about to fill
 */
export const findSingleOtpInput = (
  usefulInputs: HTMLInputElement[],
  codeLength: number
): SingleOtpInput | null => {
  const scored = usefulInputs
    .map((el) => {
      if (el.disabled || el.readOnly) {
        return null
      }
      // never put a one time code in a password box, and a single character box
      // belongs to a segmented widget, not here
      if (el.type === 'password' || isSingleCharBox(el)) {
        return null
      }
      if (DIGIT_BOX_TYPES.includes(el.type) === false) {
        return null
      }

      const autocomplete = attr(el, 'autocomplete')
      if (NON_OTP_AUTOCOMPLETE_RE.test(autocomplete)) {
        return null
      }

      const described = describeInput(el)
      if (RECOVERY_CODE_RE.test(described)) {
        return null
      }

      // a maxlength shorter than the code cannot hold it
      const hasRoom =
        el.maxLength === -1 ||
        (el.maxLength >= codeLength && el.maxLength <= MAX_SINGLE_FIELD_LENGTH)
      if (!hasRoom) {
        return null
      }

      const signals: string[] = []
      if (autocomplete.includes('one-time-code')) {
        signals.push('autocomplete-one-time-code')
      }
      if (STRONG_OTP_NAME_RE.test(described)) {
        signals.push('otp-name')
      } else if (AMBIGUOUS_OTP_NAME_RE.test(described)) {
        signals.push('ambiguous-otp-name')
      }
      if (isNumericish(el)) {
        signals.push('numeric')
      }
      if (el.maxLength >= codeLength) {
        signals.push('length-fits')
      }

      /**
       * The spec attribute is proof on its own. Otherwise an unambiguous name
       * needs one corroborating signal, and a name as vague as "code" or "pin"
       * needs both numeric entry and a matching length before we type a code
       * into it.
       */
      const qualifies =
        signals.includes('autocomplete-one-time-code') ||
        (signals.includes('otp-name') && signals.length >= 2) ||
        (signals.includes('ambiguous-otp-name') &&
          signals.includes('numeric') &&
          signals.includes('length-fits'))

      return qualifies ? { input: el, signals } : null
    })
    .filter(Boolean) as SingleOtpInput[]

  if (scored.length === 0) {
    return null
  }

  scored.sort((a, b) => b.signals.length - a.signals.length)

  // two equally plausible fields means we cannot tell which is the code box
  if (
    scored.length > 1 &&
    scored[0].signals.length === scored[1].signals.length
  ) {
    log('ambiguous single OTP candidates, not guessing', {
      candidates: scored.map((entry) => describeInput(entry.input))
    })
    return null
  }

  log('single OTP field detected', {
    signals: scored[0].signals,
    description: describeInput(scored[0].input)
  })

  return scored[0]
}

/**
 * Cheap check for "this input might be a one-time-code field", used to decide
 * whether it is worth refetching the TOTP secret when an input shows up late.
 * Deliberately loose - the real decisions are findSegmentedOtpInputs and
 * findSingleOtpInput.
 */
export const isLikelyOtpField = (el: HTMLInputElement) => {
  if (!el) {
    return false
  }
  return (
    el.type === 'number' ||
    isSingleCharBox(el) ||
    attr(el, 'autocomplete').includes('one-time-code') ||
    ariaIndexOf(el) !== null ||
    STRONG_OTP_NAME_RE.test(describeInput(el)) ||
    PASSWORD_MANAGER_IGNORE_ATTRS.some((name) => el.hasAttribute(name))
  )
}
