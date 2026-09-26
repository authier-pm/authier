import type { ILoginSecret } from '@src/util/useDeviceState'
import type { PasswordFormClassification } from './classifyPasswordForm'
import { getAllVisibleTextOnDocumentBody } from './getAllVisibleTextOnDocumentBody'

const normalizeUsername = (username: string) => username.trim().toLowerCase()

/** Account identity on the current step takes precedence over credential recency. */
export const selectLoginForPage = (
  logins: ILoginSecret[],
  classification: PasswordFormClassification
): ILoginSecret | undefined => {
  let username = classification.usernameInput?.value.trim()
  if (!username && location.hostname === 'accounts.google.com') {
    // Google keeps the chosen account outside the password form, often alongside
    // a hidden username input. Do not scan other accounts in its account picker.
    username =
      document
        .querySelector<HTMLInputElement>('input[autocomplete="username"]')
        ?.value.trim() ||
      document.getElementById('profileIdentifier')?.textContent?.trim()
  }
  if (username) {
    return logins.find(
      (login) =>
        normalizeUsername(login.loginCredentials.username) ===
        normalizeUsername(username)
    )
  }

  if (!classification.usernameInput && classification.currentPasswordInput) {
    const visibleEmails =
      getAllVisibleTextOnDocumentBody().match(
        /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+/g
      ) ?? []
    const accounts = new Set(visibleEmails.map(normalizeUsername))
    if (accounts.size > 0) {
      if (accounts.size !== 1) return undefined
      return logins.find((login) =>
        accounts.has(normalizeUsername(login.loginCredentials.username))
      )
    }
    // With no selected account, choosing among multiple password-only logins is unsafe.
    if (logins.length !== 1) return undefined
  }
  return logins[0]
}
