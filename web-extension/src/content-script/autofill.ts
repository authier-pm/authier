import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { bodyInputChangeEmitter } from './DOMObserver'
import { authenticator } from 'otplib'
import debug from 'debug'

const log = debug('au:autofill')

export type IDecryptedSecrets = {
  loginCredentials: ILoginSecret[]
  totpSecrets: ITOTPSecret[]
}

const autofillValueIntoInput = (element: HTMLInputElement, value) => {
  element.value = value
  element.dispatchEvent(
    new Event('input', {
      bubbles: true,
      cancelable: true
    })
  )
}

let enabled = false
export const autofill = (secrets: IDecryptedSecrets) => {
  if (
    enabled === false &&
    secrets.loginCredentials.length === 0 &&
    secrets.totpSecrets.length === 0
  ) {
    return
  }
  log('init autofill', secrets)

  enabled = true

  const autofillElement = (input: HTMLInputElement) => {
    if (input.autocomplete === 'username') {
      const secret = secrets.loginCredentials[0]
      if (secret) {
        autofillValueIntoInput(input, secret.loginCredentials.username)
      }
    } else if (input.autocomplete === 'current-password') {
      const secret = secrets.loginCredentials[0]
      if (secret) {
        autofillValueIntoInput(input, secret.loginCredentials.password)
      }
    } else if (input.autocomplete === 'new-password') {
      autofillValueIntoInput(input, 'TODO generate')
    } else if (input.autocomplete === 'one-time-code') {
      const totpSecret = secrets.totpSecrets[0]
      if (totpSecret) {
        const otpCode = authenticator.generate(totpSecret.totp)
        autofillValueIntoInput(input, otpCode)
      }
    }
  }
  document.body.querySelectorAll('input').forEach(autofillElement)
  bodyInputChangeEmitter.on('inputAdded', autofillElement)
}
