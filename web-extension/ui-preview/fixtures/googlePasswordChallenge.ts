import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import type { ILoginSecret } from '@src/util/useDeviceState'

export const googlePreviewLogins: ILoginSecret[] = Array.from(
  { length: 10 },
  (_, index) => {
    const number = String(index + 1).padStart(2, '0')
    return {
      id: `preview-google-${number}`,
      encrypted: 'preview-only',
      kind: EncryptedSecretType.LOGIN_CREDENTIALS,
      createdAt: '2026-01-01T00:00:00Z',
      loginCredentials: {
        username: `account${number}@example.com`,
        password: `Preview-only-password-${number}!`,
        label: `Google · Profile ${number}`,
        url: 'https://accounts.google.com/',
        iconUrl: null
      }
    }
  }
)

export const selectedGooglePreviewLogin = googlePreviewLogins[5]

// Exact password attributes from Google's supplied password challenge. The
// selected identity is outside the form; all accounts and values are synthetic.
export const googlePasswordChallengeHtml = (selectedIdentity: boolean) => `
  <div class="google-password-preview__intro">
    <div class="google-password-preview__logo" aria-label="Google">G</div>
    <h1>Welcome</h1>
    ${
      selectedIdentity
        ? `<div id="profileIdentifier" class="google-password-preview__account">${selectedGooglePreviewLogin.loginCredentials.username}</div>`
        : '<p>Choose an account with Authier</p>'
    }
  </div>
  <form class="google-password-preview__form" method="post">
    ${
      selectedIdentity
        ? `<input type="email" name="identifier" autocomplete="username" value="${selectedGooglePreviewLogin.loginCredentials.username}" style="display: none" tabindex="-1" aria-hidden="true">`
        : ''
    }
    <label class="google-password-preview__password">
      <span>Enter your password</span>
      <input type="password" class="whsOnd zHQkBf" jsname="YPqjbf" autocomplete="current-password webauthn" spellcheck="false" tabindex="0" aria-label="Enter your password" aria-describedby="c0" name="Passwd" aria-disabled="false" autocapitalize="off" data-initial-value="">
    </label>
    <div id="c0" class="google-password-preview__hint">Your saved accounts are available beside this field.</div>
    <label class="google-password-preview__show-password"><input type="checkbox"> Show password</label>
    <div class="google-password-preview__actions">
      <button type="button" class="google-password-preview__forgot">Forgot password?</button>
      <button type="submit" class="google-password-preview__next">Next</button>
    </div>
  </form>
`
