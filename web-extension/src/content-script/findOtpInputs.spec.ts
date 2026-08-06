import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  findSegmentedOtpInputs,
  findSingleOtpInput,
  isLikelyOtpField
} from './findOtpInputs'

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 10
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => 10
  })
})

beforeEach(() => {
  document.body.innerHTML = ''
})

const allInputs = () =>
  Array.from(document.querySelectorAll('input')) as HTMLInputElement[]

/** verbatim from accounts.bitfinex.com, trimmed to the OTP widget */
const BITFINEX_2FA = `
<div class="auth-layout login">
  <div class="auth-layout__content">
    <div class="login__otp">
      <h1>Two-Factor Authentication</h1>
      <div class="auth-layout__form-group">
        <p for="2fa-token">Please input Bitfinex's 2FA token from your prefered app</p>
        <div class="login__otp-code">
          ${[0, 1, 2, 3, 4, 5]
            .map(
              (i) => `<div class="otp-code-digit-wraper"><input id="otp-${i}"
                inputmode="numeric" maxlength="1" autocomplete="off"
                class="login__otp-code-digit" data-1p-ignore="true"
                data-lpignore="true" data-form-type="other" data-bwignore="true"
                data-protonpass-ignore="true" type="text" value=""></div>`
            )
            .join('')}
        </div>
      </div>
      <div class="login__btn-rows">
        <div><button class="landing-btn" type="button">Paste</button></div>
        <div><button class="landing-btn" type="button">Back</button></div>
      </div>
    </div>
  </div>
</div>`

describe('bitfinex', () => {
  it('detects the six digit boxes', () => {
    document.body.innerHTML = BITFINEX_2FA

    const result = findSegmentedOtpInputs(allInputs())

    expect(result).not.toBeNull()
    expect(result!.inputs.map((el) => el.id)).toEqual([
      'otp-0',
      'otp-1',
      'otp-2',
      'otp-3',
      'otp-4',
      'otp-5'
    ])
  })

  it('corroborates via numeric boxes, container and sequential ids', () => {
    document.body.innerHTML = BITFINEX_2FA

    const result = findSegmentedOtpInputs(allInputs())

    expect(result!.signals).toEqual(
      expect.arrayContaining([
        'numeric-boxes',
        'otp-container',
        'sequential-names'
      ])
    )
  })

  it('is not blocked by the password manager ignore attributes', () => {
    document.body.innerHTML = BITFINEX_2FA

    // the site sets data-1p-ignore / data-lpignore to stop credential
    // stuffing, which must not stop us filling a 2FA code
    expect(findSegmentedOtpInputs(allInputs())).not.toBeNull()
  })
})

describe('other implementations', () => {
  it('detects google style aria-labelled number boxes', () => {
    document.body.innerHTML = `<div class="challenge">${[1, 2, 3, 4, 5, 6]
      .map(
        (i) =>
          `<input type="number" maxlength="1" aria-label="code input ${i} of 6">`
      )
      .join('')}</div>`

    const result = findSegmentedOtpInputs(allInputs())

    expect(result!.inputs).toHaveLength(6)
    expect(result!.signals).toContain('aria-indexed-boxes')
  })

  it('orders by the aria-label index, not DOM order', () => {
    document.body.innerHTML = `<div class="verification-code">
      <input id="c3" type="text" maxlength="1" inputmode="numeric" aria-label="code input 3 of 6">
      <input id="c1" type="text" maxlength="1" inputmode="numeric" aria-label="code input 1 of 6">
      <input id="c2" type="text" maxlength="1" inputmode="numeric" aria-label="code input 2 of 6">
      <input id="c6" type="text" maxlength="1" inputmode="numeric" aria-label="code input 6 of 6">
      <input id="c4" type="text" maxlength="1" inputmode="numeric" aria-label="code input 4 of 6">
      <input id="c5" type="text" maxlength="1" inputmode="numeric" aria-label="code input 5 of 6">
    </div>`

    const result = findSegmentedOtpInputs(allInputs())

    expect(result!.inputs.map((el) => el.id)).toEqual([
      'c1',
      'c2',
      'c3',
      'c4',
      'c5',
      'c6'
    ])
  })

  it('detects boxes marked with autocomplete=one-time-code', () => {
    document.body.innerHTML = `<div class="wrapper">${[0, 1, 2, 3, 4, 5]
      .map(
        () =>
          `<input type="text" maxlength="1" autocomplete="one-time-code" inputmode="numeric">`
      )
      .join('')}</div>`

    const result = findSegmentedOtpInputs(allInputs())

    expect(result!.signals).toContain('autocomplete-one-time-code')
  })

  it('detects react-otp-input, which sets no maxlength at all', () => {
    document.body.innerHTML = `<div style="display:flex;align-items:center">${[
      1, 2, 3, 4, 5, 6
    ]
      .map(
        (i) =>
          `<input id="r${i}" class="otp-box" type="text" inputmode="numeric"
             autocomplete="off" aria-label="Please enter OTP character ${i}"
             style="width:1em;text-align:center">`
      )
      .join('')}</div>`

    const result = findSegmentedOtpInputs(allInputs())

    expect(result).not.toBeNull()
    expect(result!.inputs).toHaveLength(6)
    expect(result!.signals).toContain('aria-indexed-boxes')
  })

  it('detects vue-otp-input number boxes with max=9 and no maxlength', () => {
    document.body.innerHTML = `<div class="wrap">${[1, 2, 3, 4, 5, 6]
      .map(
        (i) =>
          `<div style="display:flex;align-items:center"><input id="v${i}" class="otp" type="number" min="0" max="9"></div>`
      )
      .join('')}</div>`

    const result = findSegmentedOtpInputs(allInputs())

    expect(result).not.toBeNull()
    expect(result!.signals).toEqual(
      expect.arrayContaining(['single-char-boxes', 'numeric-boxes'])
    )
  })

  it('detects the clerk headless pattern, maxlength=6 on the first box', () => {
    // "Only the first slot advertises autofill so browsers drop the whole SMS
    // code into it" - clerk/javascript packages/headless otp-input.tsx
    document.body.innerHTML = `<div class="slots">${[1, 2, 3, 4, 5, 6]
      .map(
        (i) =>
          `<input id="s${i}" class="slot" type="text" inputmode="numeric"
             maxlength="${i === 1 ? 6 : 1}"
             autocomplete="${i === 1 ? 'one-time-code' : 'off'}"
             aria-label="Character ${i} of 6">`
      )
      .join('')}</div>`

    const result = findSegmentedOtpInputs(allInputs(), 6)

    expect(result).not.toBeNull()
    expect(result!.inputs.map((el) => el.id)).toEqual([
      's1',
      's2',
      's3',
      's4',
      's5',
      's6'
    ])
    expect(result!.signals).toEqual(
      expect.arrayContaining([
        'single-char-boxes',
        'autocomplete-one-time-code'
      ])
    )
  })

  it('treats password manager ignore attributes as an OTP tell', () => {
    document.body.innerHTML = `<div class="wrap">${[1, 2, 3, 4, 5, 6]
      .map(
        () =>
          `<input class="b" type="text" maxlength="1" data-1p-ignore="true" data-lpignore="true">`
      )
      .join('')}</div>`

    const result = findSegmentedOtpInputs(allInputs())

    expect(result!.signals).toContain('password-manager-ignore-attrs')
  })

  it('detects a four box group', () => {
    document.body.innerHTML = `<div class="otp-wrap">${[0, 1, 2, 3]
      .map(
        (i) =>
          `<input id="d-${i}" type="tel" maxlength="1" inputmode="numeric">`
      )
      .join('')}</div>`

    expect(findSegmentedOtpInputs(allInputs())!.inputs).toHaveLength(4)
  })
})

describe('false positives', () => {
  it('ignores a login form', () => {
    document.body.innerHTML = `<form>
      <input type="text" autocomplete="username" />
      <input type="password" autocomplete="current-password" />
    </form>`

    expect(findSegmentedOtpInputs(allInputs())).toBeNull()
  })

  it('ignores single character inputs that are not grouped', () => {
    document.body.innerHTML = `
      <div class="a"><input type="text" maxlength="1"><input type="text" name="other"></div>
      <div class="b"><input type="text" maxlength="1"><input type="text" name="other2"></div>
      <div class="c"><input type="text" maxlength="1"><input type="text" name="other3"></div>
      <div class="d"><input type="text" maxlength="1"><input type="text" name="other4"></div>`

    expect(findSegmentedOtpInputs(allInputs())).toBeNull()
  })

  it('ignores a group of single char boxes with nothing 2FA about them', () => {
    // e.g. a crossword or a date-part widget
    document.body.innerHTML = `<div class="puzzle">${[0, 1, 2, 3, 4, 5]
      .map(() => `<input type="text" maxlength="1">`)
      .join('')}</div>`

    expect(findSegmentedOtpInputs(allInputs())).toBeNull()
  })

  it('ignores disabled and readonly boxes', () => {
    document.body.innerHTML = `<div class="otp-wrap">${[0, 1, 2, 3, 4, 5]
      .map(
        (i) =>
          `<input id="o-${i}" type="text" maxlength="1" inputmode="numeric" disabled>`
      )
      .join('')}</div>`

    expect(findSegmentedOtpInputs(allInputs())).toBeNull()
  })

  it('rejects a group whose size does not match the code length', () => {
    document.body.innerHTML = `<div class="otp-wrap">${[0, 1, 2, 3]
      .map(
        (i) =>
          `<input id="d-${i}" type="text" maxlength="1" inputmode="numeric">`
      )
      .join('')}</div>`

    expect(findSegmentedOtpInputs(allInputs(), 6)).toBeNull()
    expect(findSegmentedOtpInputs(allInputs(), 4)).not.toBeNull()
  })
})

describe('picking between groups', () => {
  it('prefers the group with the most corroboration', () => {
    document.body.innerHTML = `
      <div class="pin-wrap">${[0, 1, 2, 3, 4, 5]
        .map(
          () =>
            `<input class="pin" type="text" maxlength="1" inputmode="numeric">`
        )
        .join('')}</div>
      <div class="login__otp-code">${[0, 1, 2, 3, 4, 5]
        .map(
          (i) =>
            `<input id="otp-${i}" class="otp" type="text" maxlength="1" inputmode="numeric">`
        )
        .join('')}</div>`

    const result = findSegmentedOtpInputs(allInputs())

    expect(result!.inputs[0].id).toBe('otp-0')
  })
})

describe('isLikelyOtpField', () => {
  it('accepts a bare single char box', () => {
    document.body.innerHTML = `<input id="x" type="text" maxlength="1" inputmode="numeric">`

    expect(
      isLikelyOtpField(document.getElementById('x') as HTMLInputElement)
    ).toBe(true)
  })

  it('rejects a normal text input', () => {
    document.body.innerHTML = `<input id="x" type="text" name="username">`

    expect(
      isLikelyOtpField(document.getElementById('x') as HTMLInputElement)
    ).toBe(false)
  })
})

describe('single field OTP inputs', () => {
  const find = () => findSingleOtpInput(allInputs(), 6)

  // markup below is taken from each site's shipped production bundle
  it.each([
    [
      'binance',
      `<input class="bn-textField-input" data-e2e="input-mfa" maxlength="6"
         inputmode="numeric" autocomplete="one-time-code" spellcheck="false"
         role="textbox" aria-label="Text field">`
    ],
    [
      'kraken',
      `<input type="text" name="tfa" autocomplete="one-time-code"
         spellcheck="false" placeholder="• • • • • •">`
    ],
    [
      'robinhood',
      `<input type="text" inputmode="numeric" maxlength="6"
         autocomplete="one-time-code" placeholder="000000"
         data-testid="MfaCodeInput">`
    ],
    [
      'okta (autocomplete deliberately downgraded to off on desktop)',
      `<input type="text" inputmode="numeric" autocomplete="off"
         id="credentials.passcode" name="credentials.passcode"
         data-se="credentials.passcode">`
    ],
    [
      'google (autocomplete off)',
      `<input type="tel" pattern="[0-9 ]*" id="totpPin" name="Pin"
         autocomplete="off" placeholder="Enter the 6-digit code">`
    ],
    [
      'wise (no autocomplete at all)',
      `<input id="code-4271" class="form-control plain-code-input"
         pattern="\\d*" inputmode="numeric" maxlength="6" data-testid="plain">`
    ],
    [
      'auth0 lock',
      `<input id="1-mfa_code" type="text" name="mfa_code" class="auth0-lock-input"
         autocomplete="off" inputmode="numeric"
         aria-label="Multi factor authentication code">`
    ],
    [
      'twilio recommended markup',
      `<input type="text" inputmode="numeric" autocomplete="one-time-code" pattern="\\d{6}" required>`
    ]
  ])('detects %s', (_name, html) => {
    document.body.innerHTML = html

    expect(find()).not.toBeNull()
  })

  it('detects the single real input behind fake digit boxes', () => {
    // input-otp / Stripe / Shopify all render one input over N fake divs
    document.body.innerHTML = `
      <div data-input-otp-container>
        ${[0, 1, 2, 3, 4, 5].map(() => `<div data-slot="input-otp-slot"></div>`).join('')}
        <div style="position:absolute;inset:0;pointer-events:none">
          <input data-input-otp autocomplete="one-time-code" inputmode="numeric"
                 maxlength="6" spellcheck="false">
        </div>
      </div>`

    expect(find()!.signals).toContain('autocomplete-one-time-code')
  })

  describe('refuses to guess', () => {
    it('leaves password fields alone', () => {
      document.body.innerHTML = `<input type="password" name="otp-code" maxlength="6">`

      expect(find()).toBeNull()
    })

    it('leaves a username field alone', () => {
      document.body.innerHTML = `<input type="text" autocomplete="username" name="code">`

      expect(find()).toBeNull()
    })

    it('leaves a recovery code field alone', () => {
      document.body.innerHTML = `<input type="text" inputmode="numeric" maxlength="8"
        name="backupCode" placeholder="xxxx-xxxx">`

      expect(find()).toBeNull()
    })

    it('ignores a field too short to hold the code', () => {
      document.body.innerHTML = `<input type="text" inputmode="numeric" maxlength="4" name="otp">`

      expect(find()).toBeNull()
    })

    it('ignores a bare unnamed text input', () => {
      document.body.innerHTML = `<input type="text">`

      expect(find()).toBeNull()
    })

    it('needs more than the word "code" on its own', () => {
      // no numeric hint, no length hint - too weak to type a code into
      document.body.innerHTML = `<input type="text" name="discount_code">`

      expect(find()).toBeNull()
    })

    it('bails when two fields look equally plausible', () => {
      document.body.innerHTML = `
        <input type="text" name="otp" inputmode="numeric" maxlength="6">
        <input type="text" name="mfa" inputmode="numeric" maxlength="6">`

      expect(find()).toBeNull()
    })

    it('does not pick a digit box out of a segmented widget', () => {
      document.body.innerHTML = BITFINEX_2FA

      expect(find()).toBeNull()
    })
  })
})

describe('single field OTP inputs vs payment fields', () => {
  it('never treats a card security code as a TOTP field', () => {
    // "security code" is the CVV label on most checkout forms
    document.body.innerHTML = `<input type="text" inputmode="numeric" maxlength="4"
      name="security_code" placeholder="Security code" autocomplete="cc-csc">`

    expect(findSingleOtpInput(allInputs(), 6)).toBeNull()
  })

  it('never treats a CVV field as a TOTP field', () => {
    document.body.innerHTML = `<input type="text" inputmode="numeric" maxlength="6" name="cvv">`

    expect(findSingleOtpInput(allInputs(), 6)).toBeNull()
  })
})
