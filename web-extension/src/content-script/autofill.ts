/* eslint-disable @typescript-eslint/no-empty-function */
import { bodyInputChangeEmitter } from './domMutationObserver'
import { authenticator } from 'otplib'
import debug from 'debug'
import { generate } from 'generate-password'
import browser from 'webextension-polyfill'
import { isElementInViewport, isHidden } from './isElementInViewport'
import { domRecorder, IInitStateRes } from './contentScript'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { authierColors } from '../../../shared/chakraRawTheme'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { debounce } from 'lodash'
import { renderLoginCredOption } from './renderLoginCredOption'
import { getSelectorForElement } from './DOMEventsRecorder'
import { ILoginSecret, ITOTPSecret } from '../util/useDeviceState'
import { BackgroundMessageType } from '../background/BackgroundMessageType'
import { renderPasswordGenerator } from './renderPasswordGenerator'

const log = debug('au:autofill')

export type IDecryptedSecrets = {
  loginCredentials: ILoginSecret[]
  totpSecrets: ITOTPSecret[]
}

type webInput = {
  url: string
  host: string
  domPath: string
  kind: WebInputType
  createdAt: string
}

export const autofillEventsDispatched = new Set()

function imitateKeyInput(el: HTMLInputElement, keyChar: string) {
  if (el) {
    const keyboardEventInit = {
      bubbles: false,
      cancelable: false,
      composed: false,
      key: '',
      code: '',
      location: 0
    }
    const keyDown = new KeyboardEvent('keydown', keyboardEventInit)
    autofillEventsDispatched.add(keyDown)
    el.dispatchEvent(keyDown)

    el.value = keyChar

    const keyUp = new KeyboardEvent('keyup', keyboardEventInit)
    autofillEventsDispatched.add(keyUp)
    el.dispatchEvent(keyUp)

    const change = new Event('change', { bubbles: true })
    autofillEventsDispatched.add(change)
    el.dispatchEvent(change)
  } else {
    console.log('el is null')
  }
}

export const autofillValueIntoInput = (
  element: HTMLInputElement,
  value: string
) => {
  log('autofillValueIntoInput:', value, element)

  if (element.childNodes.length > 0) {
    //we should again loop through the children of the element and find th right input
    //@ts-ignore
    imitateKeyInput(element.childNodes[0], value)
  }

  if (isElementInViewport(element) === false || isHidden(element)) {
    log('isHidden')
    return null // could be dangerous to autofill into a hidden element-if the website got hacked, someone could be using this: https://websecurity.dev/password-managers/autofill/
  }

  element.style.backgroundColor = authierColors.green[400]
  imitateKeyInput(element, value)

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

const filterUselessInputs = (documentBody: HTMLElement) => {
  const inputEls = documentBody.querySelectorAll('input')
  const inputElsArray: HTMLInputElement[] = Array.from(inputEls).filter(
    (el) =>
      uselessInputTypes.includes(el.type) === false &&
      el.offsetWidth > 0 &&
      el.offsetHeight > 0
  )
  return inputElsArray
}

export let autofillEnabled = false
let onInputAddedHandler

export const autofill = (initState: IInitStateRes, autofillEnabled = false) => {
  const { secretsForHost, webInputs } = initState

  if (autofillEnabled === true) {
    log('enabled is true, returning')
    return () => {}
  }
  log('init autofill', initState)

  autofillEnabled = true
  const namePassSecret = secretsForHost.loginCredentials[0]
  const totpSecret = secretsForHost.totpSecrets[0]

  //? Should be renamed on scanOnInputs?
  //!Fill known inputs
  const scanKnownWebInputsAndFillWhenFound = (body: HTMLBodyElement) => {
    const allInputs = Array.from(body.querySelectorAll('input'))
    //Distinguish between register and login from by the number of inputs
    //Then Distinguish between phased and not phased

    /**
     * text, email, password, tel
     */
    const usefulInputs = allInputs.filter(
      (el) => uselessInputTypes.find((type) => type === el.type) === undefined
    )

    if (usefulInputs.length > 2) {
      for (let index = 0; index < allInputs.length; index++) {
        const input = allInputs[index]
        if (
          input.type === 'password' &&
          allInputs[index + 1].type === 'password'
        ) {
          // TODO Autofill register form with a new password if present
          break
        }
      }
    }

    //Fill known inputs
    const filledElements = webInputs
      .filter(({ url }) => {
        console.log('~ url', url)
        //NOTE: FIX THIS
        const host = new URL(url).host
        const matches = location.href.includes(host)

        return matches
      })
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
              authenticator.generate(totpSecret.totp.secret)
            )
          }
        }
      })
      .filter((el) => !!el)

    //After ceraint condition is met, we can assume this is register page
    const inputs = filterUselessInputs(document.body)
    console.log('Ussefull inputs', inputs)
    for (const el of inputs) {
      if (el.getAttribute('autocomplete') === 'new-password') {
        renderPasswordGenerator({ input: el })
        //TODO: show icon for psw generation
        const password = generate({
          length: 10,
          numbers: true,
          uppercase: true,
          symbols: true,
          strict: true
        })
        autofillValueIntoInput(el, password)
        log('Is register screen')
        return
      }
    }

    //!Guess web inputs, if we have credentials without DOM PATHS
    if (webInputs.length === 0 && secretsForHost.loginCredentials.length > 0) {
      const autofillResult = searchInputsAndAutofill(document.body)
      if (autofillResult) {
        browser.runtime.sendMessage({
          action: BackgroundMessageType.saveCapturedInputEvents,
          payload: {
            inputEvents: domRecorder.toJSON(),
            url: document.documentURI
          }
        })
      }
      log('autofillResult', autofillResult)
    }

    if (onInputAddedHandler) {
      bodyInputChangeEmitter.off('inputAdded', onInputAddedHandler)
    }

    //TODO: this does not work right
    //Catch new inputs
    onInputAddedHandler = debounce(
      (input) => {
        const passwordGenOptions = { length: 12, numbers: true, symbols: true } // TODO get from user's options

        // For one input on page
        if (input.autocomplete === 'new-password') {
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
      log('no secrets for host')
      return () => {}
    }

    if (filledElements.length === 2) {
      const form = filledElements[0]?.form
      log('filled both', domRecorder.toJSON())
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
      let newWebInputs: webInput[] = []
      const inputElsArray = filterUselessInputs(documentBody)

      console.log(inputElsArray, 'test')
      for (let index = 0; index < inputElsArray.length; index++) {
        const input = inputElsArray[index]
        if (input.type === 'password') {
          console.log('password', input)
          //Save password input, if we have more credentials with no DOM PATH
          if (
            webInputs.length === 0 &&
            secretsForHost.loginCredentials.length > 1
          ) {
            newWebInputs.push({
              createdAt: new Date().toString(),
              domPath: getSelectorForElement(input).css,
              host: location.host,
              url: location.href,
              kind: WebInputType.PASSWORD
            })

            domRecorder.addInputEvent({
              element: input,
              eventType: 'input',
              kind: WebInputType.PASSWORD,
              inputted: input.value
            })
          }

          //Search for a username input
          for (let j = index - 1; j >= 0; j--) {
            if (inputElsArray[j].type !== 'hidden') {
              log('found username input', inputElsArray[j])

              //Save username input, if we have more credentials wit no DOM PATH then break from loop and let user choose which psw to use
              if (
                webInputs.length === 0 &&
                secretsForHost.loginCredentials.length > 1
              ) {
                newWebInputs.push({
                  createdAt: new Date().toString(),
                  domPath: getSelectorForElement(inputElsArray[j]).css,
                  host: location.host,
                  url: location.href,
                  kind: WebInputType.USERNAME
                })

                domRecorder.addInputEvent({
                  element: inputElsArray[j],
                  eventType: 'input',
                  kind: WebInputType.USERNAME_OR_EMAIL,
                  inputted: inputElsArray[j].value
                })
                break
              }

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

          //Let user choose which credential to use
          if (
            webInputs.length === 0 &&
            secretsForHost.loginCredentials.length > 1
          ) {
            log('choose credential', domRecorder.toJSON())
            renderLoginCredOption({
              loginCredentials: secretsForHost.loginCredentials,
              webInputs: newWebInputs
            })

            return true
          }

          return false
        }
      }
      return false
    }
  }

  const scanGlobalDocument = () =>
    scanKnownWebInputsAndFillWhenFound(document.body as HTMLBodyElement)
  setTimeout(scanGlobalDocument, 150) // let's wait a bit for the page to load

  return () => {
    autofillEnabled = false
    bodyInputChangeEmitter.off('inputAdded', scanGlobalDocument)
  }
}
