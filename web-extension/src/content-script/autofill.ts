import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { bodyInputChangeEmitter } from './DOMObserver'
import { authenticator } from 'otplib'
import debug from 'debug'
import { generate } from 'generate-password'

import { isElementInViewport, isHidden } from './isElementInViewport'
import { IInitStateRes } from './contentScript'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { authierColors } from '../../../shared/chakraRawTheme'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
    return () => {}
  }
  log('init autofill', initState)

  enabled = true
  const namePassSecret = secretsForHost.loginCredentials[0]
  const totpSecret = secretsForHost.totpSecrets[0]
  const scanKnownWebInputsAndFillWhenFound = () => {
    const filledElements = webInputs
      .filter(({ url }) => url === location.href)
      .map((webInputGql) => {
        const inputEl = document.body.querySelector(
          webInputGql.domPath
        ) as HTMLInputElement

        if (inputEl) {
          if (webInputGql.kind === WebInputType.PASSWORD && namePassSecret) {
            return autofillValueIntoInput(
              inputEl,
              namePassSecret.loginCredentials.password
            )
          } else if (
            [
              WebInputType.EMAIL,
              WebInputType.USERNAME,
              WebInputType.USERNAME_OR_EMAIL
            ].includes(webInputGql.kind) &&
            namePassSecret
          ) {
            return autofillValueIntoInput(
              inputEl,
              namePassSecret.loginCredentials.username
            )
          } else if (webInputGql.kind === WebInputType.TOTP && totpSecret) {
            return autofillValueIntoInput(
              inputEl,
              authenticator.generate(totpSecret.totp)
            )
          }
        }
      })
      .filter((el) => !!el)

    bodyInputChangeEmitter.on('inputAdded', (input) => {
      const passwordGenOptions = { length: 12, numbers: true, symbols: true } // TODO get from user's options

      if (input.autocomplete === 'new-password') {
        autofillValueIntoInput(input, generate(passwordGenOptions))
      } else {
        if (input.type === 'password') {
          const passwordInputsOnPage = document.querySelectorAll(
            'input[type="password"]'
          ) as NodeListOf<HTMLInputElement>

          if (
            passwordInputsOnPage.length === 2 &&
            passwordInputsOnPage[0].autocomplete !== 'current-password' &&
            passwordInputsOnPage[1].autocomplete !== 'current-password'
          ) {
            const newPassword = generate(passwordGenOptions)
            // must be some kind of signup page
            autofillValueIntoInput(passwordInputsOnPage[0], newPassword)

            autofillValueIntoInput(passwordInputsOnPage[1], newPassword)
          }
        }
        setTimeout(scanKnownWebInputsAndFillWhenFound, 20)
      }
    })

    if (!namePassSecret && !totpSecret) {
      return () => {}
    }

    if (filledElements.length === 2) {
      const form = filledElements[0]?.form
      log('filled both', form)
      if (form) {
        // TODO try to submit the form
        // filledElements[0]?.form?.dispatchEvent(
        //   new Event('submit', {
        //     bubbles: true,
        //     cancelable: true
        //   })
        // )
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        })
        if (form.submit instanceof HTMLElement) {
          // @ts-expect-error
          form.submit.dispatchEvent(clickEvent)
        }
        // TODO show notification

        toast.success('Submitted autofilled form')
      }
    }
  }

  setTimeout(scanKnownWebInputsAndFillWhenFound, 100) // let's wait a bit for the page to load

  return () => {
    enabled = false
    bodyInputChangeEmitter.off('inputAdded', scanKnownWebInputsAndFillWhenFound)
  }
}
