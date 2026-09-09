import { WebInputType } from '@shared/generated/graphqlBaseTypes'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findCredentialPickerInput } from './findCredentialPickerInput'
import type { WebInputsArrayClientSide } from '../background/WebInputForAutofill'

vi.mock('./isElementInViewport', () => ({
  isElementVisibleInViewport: (el: HTMLElement) => !el.hidden
}))

const mapping = (
  overrides: Partial<WebInputsArrayClientSide[number]> = {}
): WebInputsArrayClientSide => [
  {
    domPath: 'input',
    domOrdinal: 0,
    kind: WebInputType.USERNAME_OR_EMAIL,
    createdAt: '2026-01-01',
    host: 'www.bitfinex.com',
    url: 'https://www.bitfinex.com/login/',
    ...overrides
  }
]

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('credential picker targets', () => {
  it('ignores mappings explicitly saved as TOTP', () => {
    document.body.innerHTML = '<input type="text">'
    expect(
      findCredentialPickerInput(mapping({ kind: WebInputType.TOTP }))
    ).toBeNull()
  })

  it.each([
    'maxlength="1" inputmode="numeric" class="login__otp-code-digit"',
    'autocomplete="one-time-code"',
    'name="credentials.passcode" inputmode="numeric"',
    'data-1p-ignore="true"'
  ])('rejects a stale account mapping on %s', (attributes) => {
    document.body.innerHTML = `<input type="text" ${attributes}>`
    expect(findCredentialPickerInput(mapping())).toBeNull()
  })

  it('respects the saved ordinal instead of anchoring to the first CSS match', () => {
    document.body.innerHTML =
      '<input maxlength="1"><input autocomplete="username">'
    expect(findCredentialPickerInput(mapping({ domOrdinal: 1 }))).toBe(
      document.querySelectorAll('input')[1]
    )
  })

  it('rejects a missing ordinal instead of falling back to another input', () => {
    document.body.innerHTML = '<input autocomplete="username">'
    expect(findCredentialPickerInput(mapping({ domOrdinal: 1 }))).toBeNull()
  })

  it('revalidates a reused DOM node when the login advances to 2FA', () => {
    document.body.innerHTML = '<input autocomplete="username">'
    expect(findCredentialPickerInput(mapping())).not.toBeNull()
    document.querySelector('input')!.autocomplete = 'one-time-code'
    expect(findCredentialPickerInput(mapping())).toBeNull()
  })

  it('does not anchor a password mapping to a plain text input', () => {
    document.body.innerHTML = '<input type="text">'
    expect(
      findCredentialPickerInput(mapping({ kind: WebInputType.PASSWORD }))
    ).toBeNull()
  })
})
