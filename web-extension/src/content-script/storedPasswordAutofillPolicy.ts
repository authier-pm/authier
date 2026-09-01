import {
  type PasswordFormClassification,
  PasswordFormKind
} from './classifyPasswordForm'

/**
 * Returns the only field that production autofill may receive a stored
 * password. Signup, password-change, and unknown forms deliberately return no
 * target even when they contain a current-password-shaped input.
 */
export const selectStoredPasswordAutofillTarget = (
  classification: PasswordFormClassification
): HTMLInputElement | null =>
  classification.kind === PasswordFormKind.LOGIN
    ? classification.currentPasswordInput
    : null

export const isStoredPasswordAutofillTarget = (
  classification: PasswordFormClassification,
  candidate: HTMLInputElement
): boolean => selectStoredPasswordAutofillTarget(classification) === candidate
