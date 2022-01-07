import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { bodyInputChangeEmitter } from './DOMObserver'
import { authenticator } from 'otplib'
import debug from 'debug'
import { generate } from 'generate-password'
import browser from 'webextension-polyfill'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'

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
  if (enabled === true) {
    return
  }
  log('init autofill', secrets)

  enabled = true

  const autofillElement = async (input: HTMLInputElement) => {
    if (input.autocomplete === 'username' || input.autocomplete === 'email') {
      const secret = secrets.loginCredentials[0]
      if (secret) {
        autofillValueIntoInput(input, secret.loginCredentials.username)
      } else {
        const fallbackUsernames: string[] = await browser.runtime.sendMessage({
          action: BackgroundMessageType.getFallbackUsernames
        })
        autofillValueIntoInput(input, fallbackUsernames[0])
      }
    } else if (input.autocomplete === 'current-password') {
      const secret = secrets.loginCredentials[0]
      if (secret) {
        autofillValueIntoInput(input, secret.loginCredentials.password)
      }
    } else if (input.autocomplete === 'new-password') {
      autofillValueIntoInput(
        input,
        generate({ length: 12, numbers: true, symbols: true }) // TODO get from user's options
      )
    } else if (input.autocomplete === 'one-time-code') {
      const totpSecret = secrets.totpSecrets[0]
      if (totpSecret) {
        const otpCode = authenticator.generate(totpSecret.totp)
        autofillValueIntoInput(input, otpCode)
      }
    }
  }

  bodyInputChangeEmitter.on('inputAdded', autofillElement)

  setTimeout(() => {
    document.body.querySelectorAll('input').forEach(autofillElement)
  }, 100) // let's wait a bit for the page to load
}
