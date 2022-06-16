/* eslint-disable @typescript-eslint/no-empty-function */
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { bodyInputChangeEmitter } from './DOMObserver'
import { authenticator } from 'otplib'
import debug from 'debug'
import { generate } from 'generate-password'

import { isElementInViewport, isHidden } from './isElementInViewport'
import { domRecorder, IInitStateRes } from './contentScript'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { authierColors } from '../../../shared/chakraRawTheme'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { debounce } from 'lodash'

const log = debug('au:autofill')

export type IDecryptedSecrets = {
  loginCredentials: ILoginSecret[]
  totpSecrets: ITOTPSecret[]
}

const autofillValueIntoInput = (element: HTMLInputElement, value) => {
  log('autofillValueIntoInput:', value)
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

export let autofillEnabled = false
let onInputAddedHandler

export const autofill = (initState: IInitStateRes) => {
  const { secretsForHost, webInputs } = initState

  if (autofillEnabled === true) {
    log('enabled is true, returning')
    return () => {}
  }
  log('init autofill', initState)

  autofillEnabled = true
  const namePassSecret = secretsForHost.loginCredentials[0]
  const totpSecret = secretsForHost.totpSecrets[0]

  // Should be renamed on scanOnInputs?
  const scanKnownWebInputsAndFillWhenFound = () => {
    //Distinguish between register and login from by the number of inputs
    //Then Distinguish between phased and not phased

    const usefulInputs = Array.from(
      document.body.querySelectorAll('input')
    ).filter(
      (el) => uselessInputTypes.find((type) => type === el.type) === undefined
    )

    if (usefulInputs.length > 2) {
      // Autofill register form
    }

    //Fill known inputs
    const filledElements = webInputs
      .filter(({ url }) => {
        const [urlNoQuery] = url.split('?')
        const matches = location.href.startsWith(urlNoQuery)

        return matches
      })
      .map((webInputGql) => {
        let inputEl

        inputEl = document.body.querySelector(
          webInputGql.domPath
        ) as HTMLInputElement

        if (!inputEl) {
          const iframeBody =
            document.querySelector('iframe')?.contentDocument?.body // we want to detect elements in the first iframe as well. Some login pages have iframes with the inputs-for example *.zendesk.com
          if (iframeBody) {
            inputEl = iframeBody.querySelector(
              webInputGql.domPath
            ) as HTMLInputElement
          }
        }
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
      const autofillRes = searchInputsAndAutofill(document.body)
      console.log('~ autofillRes', autofillRes)
      const iframe = document.createElement('iframe')
      if (autofillRes === false && iframe.contentDocument?.body) {
        // No input found, try first iframe
        searchInputsAndAutofill(iframe.contentDocument?.body)
      }
    }

    if (onInputAddedHandler) {
      bodyInputChangeEmitter.on('inputAdded', onInputAddedHandler)
    }
    onInputAddedHandler = debounce(
      (input) => {
        console.log('~ input', input)

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
          } else {
            scanKnownWebInputsAndFillWhenFound()
          }
        }
      },
      500,
      {
        trailing: true
      }
    )

    //If input shows on loaded page

    bodyInputChangeEmitter.on('inputAdded', onInputAddedHandler)

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

    function searchInputsAndAutofill(documentBody: HTMLElement) {
      const inputEls = documentBody.querySelectorAll('input')
      const inputElsArray: HTMLInputElement[] = Array.from(inputEls).filter(
        (el) => uselessInputTypes.includes(el.type) === false
      )

      for (let index = 0; index < inputElsArray.length; index++) {
        const input = inputElsArray[index]
        if (input.type === 'password') {
          //Search for a username input
          for (let j = index - 1; j >= 0; j--) {
            if (inputElsArray[j].type !== 'hidden') {
              log('found username input', inputElsArray[j])
              const autofilledElUsername = autofillValueIntoInput(
                inputElsArray[j],
                secretsForHost.loginCredentials[0].loginCredentials.username
              )

              domRecorder.addInputEvent({
                element: inputElsArray[j],
                eventType: 'input',
                inputted:
                  secretsForHost.loginCredentials[0].loginCredentials.username,
                kind: WebInputType.USERNAME
              })

              const autofilledElPassword = autofillValueIntoInput(
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

              return !!autofilledElUsername || !!autofilledElPassword
            }
          }
          return false
        }
      }
      return false
    }
  }

  setTimeout(scanKnownWebInputsAndFillWhenFound, 100) // let's wait a bit for the page to load

  return () => {
    autofillEnabled = false
    bodyInputChangeEmitter.off('inputAdded', scanKnownWebInputsAndFillWhenFound)
  }
}
