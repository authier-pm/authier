/* eslint-disable @typescript-eslint/no-empty-function */
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { bodyInputChangeEmitter } from './DOMObserver'
import { authenticator } from 'otplib'
import debug from 'debug'
import { generate } from 'generate-password'
import stringSimilarity from 'string-similarity'
import { isElementInViewport, isHidden } from './isElementInViewport'
import { domRecorder, IInitStateRes } from './contentScript'
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

  element.style.backgroundColor = authierColors.green[400]
  element.value = value
  element.dispatchEvent(
    new Event('input', {
      bubbles: true,
      cancelable: true
    })
  )

  return element
}

const uselessInputTypes = [
  'hidden',
  'submit',
  'button',
  'reset',
  'button',
  'checkbox',
  'radio',
  'file',
  'color',
  'image',
  'range',
  'search',
  'time'
]

export let enabled = false
export const autofill = (initState: IInitStateRes, fillAgain?: boolean) => {
  const { secretsForHost, webInputs } = initState

  if (enabled === true && !fillAgain) {
    log('enabled is true, returning')
    return () => {}
  }
  log('init autofill', initState)

  enabled = true
  const namePassSecret = secretsForHost.loginCredentials[0]
  const totpSecret = secretsForHost.totpSecrets[0]

  // Should be renamed on scanOnInputs?
  const scanKnownWebInputsAndFillWhenFound = () => {
    //Distinguish between register and login from by the number of inputs
    //Then Distinguish between phased and not phased

    const usefullInputs = Array.from(
      document.body.querySelectorAll('input')
    ).filter(
      (el) => uselessInputTypes.find((type) => type === el.type) === undefined
    )

    if (usefullInputs.length > 2) {
      // Autofill register form
    }

    //Fill known inputs
    const filledElements = webInputs
      .filter(({ url }) =>
        stringSimilarity.compareTwoStrings(url, location.href) > 0.5 // TODO change this to match TLD domain
          ? true
          : false
      )
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

    //Guess web input, if you have credentials
    if (
      webInputs.length === 0 &&
      secretsForHost.loginCredentials.length === 1
    ) {
      const inputEls = document.body.querySelectorAll('input')
      const inputElsArray: HTMLInputElement[] = Array.from(
        inputEls
      ) as HTMLInputElement[]

      inputElsArray.every((input, index, arr) => {
        if (input.type === 'password') {
          //Search for a username input
          for (let j = index - 1; j >= 0; j--) {
            if (arr[j].type !== 'hidden') {
              log('found username input', arr[j])
              autofillValueIntoInput(
                arr[j],
                secretsForHost.loginCredentials[0].loginCredentials.username
              )

              domRecorder.addInputEvent({
                element: arr[j],
                eventType: 'input',
                inputted:
                  secretsForHost.loginCredentials[0].loginCredentials.username,
                kind: WebInputType.USERNAME
              })

              autofillValueIntoInput(
                input,
                secretsForHost.loginCredentials[0].loginCredentials.password
              )
              domRecorder.addInputEvent({
                element: input,
                eventType: 'input',
                inputted:
                  secretsForHost.loginCredentials[0].loginCredentials.password,
                kind: WebInputType.PASSWORD
              })

              break
            }
          }
          return false
        }
        return true
      })
    }

    //If input shows on loaded page
    bodyInputChangeEmitter.on('inputAdded', (input) => {
      const passwordGenOptions = { length: 12, numbers: true, symbols: true } // TODO get from user's options

      // For one input on page
      if (
        input.autocomplete === 'new-password' ||
        (webInputs.length === 0 && input.type === 'password')
      ) {
        autofillValueIntoInput(input, generate(passwordGenOptions))
      } else {
        // More inputs on page
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
          // @ts-expect-error TODO
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
