import type { AutofillSafetyCorpus } from './schema'
import {
  OPEN_AUTOFILL_SAFETY_CORPUS_NAME,
  OPEN_AUTOFILL_SAFETY_CORPUS_VERSION
} from './schema'

const standardDocument = {
  language: 'en',
  otpCodeLength: 6
} as const

export const openAutofillSafetyCorpusV1 = {
  name: OPEN_AUTOFILL_SAFETY_CORPUS_NAME,
  version: OPEN_AUTOFILL_SAFETY_CORPUS_VERSION,
  limitations: [
    'All markup is synthetic and deliberately small; it is not copied from vendor pages.',
    'The corpus does not exercise a live browser, browser-extension permissions, cross-browser behavior, network requests, form submission, or real secrets.',
    'Passing the corpus is not a security audit, a compatibility guarantee, or evidence of a measured false-positive rate.',
    'Version 1 does not cover cross-origin frames, closed shadow roots, localization heuristics, visual layout, or hostile page scripts.'
  ],
  fixtures: [
    {
      id: 'password-only-login',
      title: 'Password-only step in a multi-step login',
      category: 'password-only-login',
      provenance: 'synthetic',
      phases: [
        {
          id: '01-current-password-step',
          description:
            'A current-password field remains a login target when the username was collected on an earlier page.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/sign-in/challenge',
            bodyHtml: `
              <main>
                <h1>Welcome back</h1>
                <form id="password-step">
                  <input
                    id="login-password"
                    type="password"
                    autocomplete="current-password"
                  />
                  <button type="submit">Continue</button>
                </form>
              </main>
            `
          },
          expected: {
            passwordKind: 'login',
            storedPasswordTargetId: 'login-password',
            otpKind: 'none',
            otpTargetIds: []
          }
        }
      ]
    },
    {
      id: 'signup-no-fill',
      title: 'Signup fields are not stored-password targets',
      category: 'signup-no-fill',
      provenance: 'synthetic',
      phases: [
        {
          id: '01-new-password-pair',
          description:
            'Two explicit new-password fields must not receive an existing stored password.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/join',
            bodyHtml: `
              <form id="signup-form">
                <input id="signup-email" type="email" autocomplete="username" />
                <input id="signup-password" type="password" autocomplete="new-password" />
                <input id="signup-password-confirmation" type="password" autocomplete="new-password" />
                <button type="submit">Create account</button>
              </form>
            `
          },
          expected: {
            passwordKind: 'signup',
            storedPasswordTargetId: null,
            otpKind: 'none',
            otpTargetIds: []
          }
        }
      ]
    },
    {
      id: 'change-password-no-fill',
      title: 'Change-password forms are not login autofill targets',
      category: 'change-password-no-fill',
      provenance: 'synthetic',
      phases: [
        {
          id: '01-current-and-new-passwords',
          description:
            'A settings form can identify the existing-password field without authorizing automatic credential fill.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/account/security',
            bodyHtml: `
              <main>
                <h1>Change password</h1>
                <form id="change-password-form">
                  <input id="old-password" type="password" autocomplete="current-password" />
                  <input id="new-password" type="password" autocomplete="new-password" />
                  <input id="new-password-confirmation" type="password" autocomplete="new-password" />
                  <button type="submit">Update password</button>
                </form>
              </main>
            `
          },
          expected: {
            passwordKind: 'change-password',
            storedPasswordTargetId: null,
            otpKind: 'none',
            otpTargetIds: []
          }
        }
      ]
    },
    {
      id: 'otp-versus-code-traps',
      title: 'OTP fields are separated from recovery and payment codes',
      category: 'otp-versus-code-traps',
      provenance: 'synthetic',
      phases: [
        {
          id: '01-single-otp',
          description: 'An explicit one-time-code field is a TOTP target.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/sign-in/verify',
            bodyHtml: `
              <form id="verification-form">
                <label for="verification-code">Authentication code</label>
                <input
                  id="verification-code"
                  name="mfa_code"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  autocomplete="one-time-code"
                />
              </form>
            `
          },
          expected: {
            passwordKind: 'none',
            storedPasswordTargetId: null,
            otpKind: 'single',
            otpTargetIds: ['verification-code']
          }
        },
        {
          id: '02-segmented-otp',
          description:
            'A corroborated six-box verification widget is an ordered TOTP target.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/sign-in/verify-boxes',
            bodyHtml: `
              <div id="otp-code-widget">
                <input id="otp-1" class="otp-box" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 1" />
                <input id="otp-2" class="otp-box" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 2" />
                <input id="otp-3" class="otp-box" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 3" />
                <input id="otp-4" class="otp-box" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 4" />
                <input id="otp-5" class="otp-box" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 5" />
                <input id="otp-6" class="otp-box" type="text" inputmode="numeric" maxlength="1" aria-label="Digit 6" />
              </div>
            `
          },
          expected: {
            passwordKind: 'none',
            storedPasswordTargetId: null,
            otpKind: 'segmented',
            otpTargetIds: ['otp-1', 'otp-2', 'otp-3', 'otp-4', 'otp-5', 'otp-6']
          }
        },
        {
          id: '03-recovery-code-trap',
          description:
            'A recovery-code field stays excluded even when misleading markup advertises one-time-code.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/account/recovery',
            bodyHtml: `
              <form id="recovery-form">
                <label for="recovery-code">Recovery code</label>
                <input
                  id="recovery-code"
                  name="recovery_code"
                  type="text"
                  inputmode="numeric"
                  maxlength="10"
                  autocomplete="one-time-code"
                />
              </form>
            `
          },
          expected: {
            passwordKind: 'none',
            storedPasswordTargetId: null,
            otpKind: 'none',
            otpTargetIds: []
          }
        },
        {
          id: '04-card-security-code-trap',
          description:
            'A card verification value is payment data, not a one-time authentication code.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/checkout',
            bodyHtml: `
              <form id="payment-form">
                <label for="card-security-code">Card security code</label>
                <input
                  id="card-security-code"
                  name="cvv"
                  type="text"
                  inputmode="numeric"
                  maxlength="3"
                  autocomplete="cc-csc"
                />
              </form>
            `
          },
          expected: {
            passwordKind: 'none',
            storedPasswordTargetId: null,
            otpKind: 'none',
            otpTargetIds: []
          }
        }
      ]
    },
    {
      id: 'ambiguity',
      title: 'Ambiguous targets cause abstention',
      category: 'ambiguity',
      provenance: 'synthetic',
      phases: [
        {
          id: '01-unannotated-password-form',
          description:
            'An unannotated password form without decisive context is not treated as a login target.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/access',
            bodyHtml: `
              <form id="ambiguous-password-form">
                <input id="account-alias" type="text" name="account-alias" />
                <input id="ambiguous-password" type="password" />
                <button type="submit">Proceed</button>
              </form>
            `
          },
          expected: {
            passwordKind: 'unknown',
            storedPasswordTargetId: null,
            otpKind: 'none',
            otpTargetIds: []
          }
        },
        {
          id: '02-two-equally-plausible-otp-fields',
          description:
            'Two equally scored OTP candidates are not resolved by DOM order.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/verify-choice',
            bodyHtml: `
              <form id="ambiguous-code-form">
                <input id="verification-left" name="mfa_code_left" type="text" inputmode="numeric" maxlength="6" />
                <input id="verification-right" name="mfa_code_right" type="text" inputmode="numeric" maxlength="6" />
              </form>
            `
          },
          expected: {
            passwordKind: 'none',
            storedPasswordTargetId: null,
            otpKind: 'none',
            otpTargetIds: []
          }
        }
      ]
    },
    {
      id: 'dynamic-replacement',
      title: 'Multi-step authentication replaces its inputs',
      category: 'dynamic-replacement',
      provenance: 'synthetic',
      phases: [
        {
          id: '01-identifier-step',
          description: 'The first DOM has an identifier and no secret target.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/session/identifier',
            bodyHtml: `
              <form id="session-step">
                <input id="session-identifier" type="email" autocomplete="username" />
                <button type="submit">Continue</button>
              </form>
            `
          },
          expected: {
            passwordKind: 'none',
            storedPasswordTargetId: null,
            otpKind: 'none',
            otpTargetIds: []
          }
        },
        {
          id: '02-password-step',
          description:
            'After replacement, the newly queried current-password node is the login target.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/session/password',
            bodyHtml: `
              <form id="session-step">
                <input id="session-password" type="password" autocomplete="current-password" />
                <button type="submit">Continue</button>
              </form>
            `
          },
          expected: {
            passwordKind: 'login',
            storedPasswordTargetId: 'session-password',
            otpKind: 'none',
            otpTargetIds: []
          }
        },
        {
          id: '03-otp-step',
          description:
            'A second replacement removes the password target and introduces a fresh OTP target.',
          document: {
            ...standardDocument,
            url: 'https://synthetic.invalid/session/otp',
            bodyHtml: `
              <form id="session-step">
                <input
                  id="session-otp"
                  name="otp_code"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  autocomplete="one-time-code"
                />
                <button type="submit">Verify</button>
              </form>
            `
          },
          expected: {
            passwordKind: 'none',
            storedPasswordTargetId: null,
            otpKind: 'single',
            otpTargetIds: ['session-otp']
          }
        }
      ]
    }
  ]
} as const satisfies AutofillSafetyCorpus
