import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { bodyInputChangeEmitter } from './DOMObserver'
import { authenticator } from 'otplib'
import debug from 'debug'
import { generate } from 'generate-password'
import browser from 'webextension-polyfill'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { isElementInViewport, isHidden } from './isElementInViewport'
import { IInitStateRes } from './contentScript'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { authierColors } from '../../../shared/chakraCustomTheme'
import { toast } from 'react-toastify'

const log = debug('au:autofill')

export type IDecryptedSecrets = {
  loginCredentials: ILoginSecret[]
  totpSecrets: ITOTPSecret[]
}

const autofillValueIntoInput = (element: HTMLInputElement, value) => {
  //
  if (isElementInViewport(element) === false || isHidden(element)) {
    return null // could be dangerous to autofill into a hidden element-if the website got hacked, someone could be using this: https://websecurity.dev/password-managers/autofill/
  }

  element.style.borderColor = authierColors.green[400]
  element.value = value
  element.dispatchEvent(
    new Event('input', {
      bubbles: true,
      cancelable: true
    })
  )
  return element
}

let enabled = false
export const autofill = (initState: IInitStateRes) => {
  const { secretsForHost, webInputs } = initState

  if (enabled === true) {
    return
  }
  log('init autofill', initState)

  enabled = true

  const secret = secretsForHost.loginCredentials[0]

  if (!secret) {
    return
  }

  const scanKnownWebInputsAndFillWhenFound = () => {
    const filledElements = webInputs
      .filter(({ url }) => url === location.href)
      .map((webInputGql) => {
        const inputEl = document.body.querySelector(webInputGql.domPath)

        if (inputEl) {
          if (webInputGql.kind === WebInputType.PASSWORD) {
            return autofillValueIntoInput(
              inputEl as HTMLInputElement,
              secret.loginCredentials.password
            )
          } else if (
            webInputGql.kind === WebInputType.USERNAME ||
            webInputGql.kind === WebInputType.USERNAME_OR_EMAIL
          ) {
            return autofillValueIntoInput(
              inputEl as HTMLInputElement,
              secret.loginCredentials.username
            )
          }
        }
      })

    if (filledElements.length === 2) {
      log('filled both')
      const form = filledElements[0]?.form
      if (form) {
        // TODO try to submit the form
        filledElements[0]?.form?.dispatchEvent(
          new Event('submit', {
            bubbles: true,
            cancelable: true
          })
        )
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        })
        // @ts-expect-error
        form.submit.dispatchEvent(clickEvent)
        // TODO show notification

        toast.success('Autofilled form')
      }
    }
  }
  bodyInputChangeEmitter.on('inputAdded', (input) => {
    if (input.autocomplete === 'new-password') {
      autofillValueIntoInput(
        input,
        generate({ length: 12, numbers: true, symbols: true }) // TODO get from user's options
      )
    } else {
      setTimeout(scanKnownWebInputsAndFillWhenFound, 20)
    }
  })

  setTimeout(scanKnownWebInputsAndFillWhenFound, 100) // let's wait a bit for the page to load
}
