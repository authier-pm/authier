import { bodyInputChangeEmitter } from './domMutationObserver'
import { authenticator } from 'otplib'
import debug from 'debug'
import { generate } from 'generate-password'
import { isElementInViewport, isHidden } from './isElementInViewport'
import { domRecorder, IInitStateRes } from './contentScript'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { authierColors } from '../../../shared/chakraRawTheme'
import { Notyf } from 'notyf'
import 'notyf/notyf.min.css'
import { debounce } from 'lodash'
import { renderLoginCredOption } from './renderLoginCredOption'
import { getSelectorForElement } from './DOMEventsRecorder'
import {
  ILoginSecret,
  ITOTPSecret,
  LoginCredentialsTypeWithMeta
} from '../util/useDeviceState'
import { renderPasswordGenerator } from './renderPasswordGenerator'
import { getTRPCCached } from './connectTRPC'
import { getAllVisibleTextOnDocumentBody } from './getAllVisibleTextOnDocumentBody'
import { renderSaveCredentialsForm } from './renderSaveCredentialsForm'

import browser from 'webextension-polyfill'
import { generateQuerySelectorForOrphanedElement } from './generateQuerySelectorForOrphanedElement'

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

const notyf = new Notyf({
  duration: 5000
})

/**
 * triggered when page contains 2 or more useful inputs
 * @param usefulInputs
 */
function handleNewPasswordCase(usefulInputs: HTMLInputElement[]) {
  for (let index = 0; index < usefulInputs.length - 1; index++) {
    const input = usefulInputs[index]
    if (
      input.type === 'password' &&
      usefulInputs[index + 1].type === 'password'
    ) {
      const newPassword = generatePasswordBasedOnUserConfig()
      autofillValueIntoInput(usefulInputs[index], newPassword)
      autofillValueIntoInput(usefulInputs[index + 1], newPassword)

      renderSaveCredentialsForm(null, newPassword)
      return true
    } else if (input.getAttribute('autocomplete')?.includes('new-password')) {
      renderPasswordGenerator({ input: input })
      const password = generate({
        length: 10,
        numbers: true,
        uppercase: true,
        symbols: true,
        strict: true
      })
      autofillValueIntoInput(input, password)
      return true
    }
  }
}

function imitateKeyInput(el: HTMLInputElement, input: string) {
  if (el) {
    for (let i = 0; i < input.length; i++) {
      const key = input[i]
      const keyboardEventInit = {
        bubbles: false,
        cancelable: false,
        composed: false,
        key: key,
        keyCode: key.charCodeAt(0),
        location: 0
      }
      const keyDown = new KeyboardEvent('keydown', keyboardEventInit)
      autofillEventsDispatched.add(keyDown)
      el.dispatchEvent(keyDown)

      const keyPress = new KeyboardEvent('keypress', keyboardEventInit)
      autofillEventsDispatched.add(keyPress)
      el.dispatchEvent(keyPress)

      const keyUp = new KeyboardEvent('keyup', keyboardEventInit)
      autofillEventsDispatched.add(keyUp)
      el.dispatchEvent(keyUp)

      const change = new Event('change', { bubbles: true })
      autofillEventsDispatched.add(change)
      el.dispatchEvent(change)
    }
  } else {
    console.error('el is null')
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
  browser.storage.local.set({
    // used for multi-step password autofill later
    lastAutofilledValue: value
  })
  imitateKeyInput(element, value)

  return element
}

export const fillPasswordIntoInput = (
  inputEl: HTMLInputElement,
  loginCredential: LoginCredentialsTypeWithMeta
) => {
  passwordFilledForThisPage = true

  const el = autofillValueIntoInput(inputEl, loginCredential.password)

  el &&
    notyf.success(
      `Autofilled password for ${
        loginCredential.username
      } into element ${generateQuerySelectorForOrphanedElement(el)}`
    )

  return el
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
/**
 * @returns elements on the page which are visible and of type text, email, password, tel
 */
const filterUselessInputs = (documentBody: HTMLElement) => {
  const inputEls = documentBody.querySelectorAll('input')
  const inputElsArray: HTMLInputElement[] = Array.from(inputEls).filter(
    (el) => {
      return (
        uselessInputTypes.includes(el.type) === false &&
        el.offsetWidth > 0 && // filter out hidden elements
        el.offsetHeight > 0 &&
        el.value === '' // filter out elements that already have a value
      )
    }
  )
  return inputElsArray
}

export const getElementCoordinates = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  return {
    x: rect.x,
    y: rect.y
  }
}

export let passwordFilledForThisPage = false
let onInputAddedHandler = (inputEl: any) => {}

const filledElements: Array<HTMLInputElement | null> = []

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const autofill = (initState: IInitStateRes) => {
  const trpc = getTRPCCached()
  const { secretsForHost, webInputs } = initState

  if (passwordFilledForThisPage === true) {
    log('autofill already ran, returning')
    return () => {}
  }
  log('init autofill', initState)

  const firstLoginCred = secretsForHost.loginCredentials[0]
  const totpSecret = secretsForHost.totpSecrets[0]

  //NOTE: scan all inputs
  /**
   *
   * @returns array of all useful inputs on the page
   */
  const scanKnownWebInputsAndFillWhenFound = async () => {
    const { body } = document
    /**
     * filter text, email, password, tel
     */
    let usefulInputs = filterUselessInputs(body)

    //Distinguish between register and login from by the number of inputs
    //Then Distinguish between phased and not phased

    //Register screen
    //After certain condition is met, we can assume this is register page
    log('usefulInputs', usefulInputs)

    if (usefulInputs.length === 0) {
      await wait(400)

      usefulInputs = filterUselessInputs(body)
    }

    if (usefulInputs.length >= 2) {
      const isNewPassword = handleNewPasswordCase(usefulInputs)
      if (isNewPassword) {
        return
      }
    }
    let matchingWebInputs = webInputs.filter(({ url }) => {
      const matches = url.startsWith(location.href)

      return matches
    })
    if (matchingWebInputs.length < 2) {
      matchingWebInputs = webInputs
    }
    //Fill known inputs
    let foundInputsCount = 0
    for (const webInputGql of matchingWebInputs) {
      const inputEl = body.querySelector(
        webInputGql.domPath
      ) as HTMLInputElement | null

      // log('inputEl', inputEl)
      //NOTE: We found element by DOM path
      if (inputEl) {
        foundInputsCount++
        log(`autofilled by domPath ${webInputGql.domPath}`)
        if (
          webInputGql.kind === WebInputType.PASSWORD &&
          firstLoginCred &&
          inputEl.type === 'password' // we don't want to autofill password to any other type of input
        ) {
          const el = fillPasswordIntoInput(
            inputEl,
            firstLoginCred.loginCredentials
          )

          filledElements.push(el)
        } else if (
          [
            WebInputType.EMAIL,
            WebInputType.USERNAME,
            WebInputType.USERNAME_OR_EMAIL
          ].includes(webInputGql.kind) &&
          firstLoginCred
        ) {
          const el = autofillValueIntoInput(
            inputEl,
            firstLoginCred.loginCredentials.username
          )
          filledElements.push(el)
        } else if (webInputGql.kind === WebInputType.TOTP && totpSecret) {
          const el = autofillValueIntoInput(
            inputEl,
            //@sleaper TODO: fix this
            authenticator.generate(totpSecret.totp.secret)
          )
          filledElements.push(el)
        }

        if (filledElements.length >= 2) {
          break
        }
        //NOTE: We did not find element by DOM path
      } else {
        // TODO we must let API know the element was not found. API will increase notFoundCount for this element and if it reaches a certain threshold, we should delete the element from the DB
      }
    }

    //NOTE: Guess web inputs, if we have credentials without DOM PATHS
    if (
      foundInputsCount === 0 &&
      secretsForHost.loginCredentials.length > 0
      // filledElements.length === 0
    ) {
      const autofillResult = await searchInputsAndAutofill(body)
      if (autofillResult) {
        await trpc.saveCapturedInputEvents.mutate({
          inputEvents: domRecorder.toJSON(),
          url: document.documentURI
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
      (inputEl) => {
        if (filledElements.length >= 2) {
          return // we have already filled 2 inputs on this page, we don't need to fill any more
        }
        log('onInputAddedHandler', inputEl)
        const newPassword: string | null = null
        // For one input on page
        if (inputEl.type === 'username' || inputEl.type === 'email') {
          if (secretsForHost.loginCredentials.length === 1) {
            fillPasswordIntoInput(inputEl, firstLoginCred.loginCredentials)
          } else {
            // todo show prompt to user to select which credential to use
          }
        } else if (inputEl.autocomplete?.includes('new-password')) {
          const newPassword = generatePasswordBasedOnUserConfig()
          autofillValueIntoInput(inputEl, newPassword)
          // TODO show prompt to user to save the newly generated password
        } else {
          // More inputs on page
          if (inputEl.type === 'password') {
            const passwordInputsOnPage = document.querySelectorAll(
              'input[type="password"]'
            ) as NodeListOf<HTMLInputElement>

            if (passwordInputsOnPage.length === 2) {
              if (
                passwordInputsOnPage[0].autocomplete?.includes(
                  'current-password'
                ) === false &&
                passwordInputsOnPage[1].autocomplete?.includes(
                  'current-password'
                ) === false
              ) {
                const newPassword = generatePasswordBasedOnUserConfig()

                // must be some kind of signup page
                autofillValueIntoInput(passwordInputsOnPage[0], newPassword)

                autofillValueIntoInput(passwordInputsOnPage[1], newPassword)
              }
            }
          }
        }

        if (newPassword) {
          renderSaveCredentialsForm(null, newPassword)
        }
      },
      500,
      {
        trailing: true,
        leading: false
      }
    )

    if (!firstLoginCred && !totpSecret) {
      log('no secrets for host')
      return () => {}
    }

    if (filledElements.length === 2) {
      const form = filledElements[0]?.form
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

        const notAPasswordInput = filledElements.find(
          (el) => el?.type !== 'password'
        )
        if (notAPasswordInput?.[0]) {
          notyf.success(
            `Submitted autofilled form for user "${notAPasswordInput[0].value}}"`
          )
        }
      }
    }

    async function searchInputsAndAutofill(documentBody: HTMLElement) {
      const newWebInputs: webInput[] = []
      const inputElsArray = filterUselessInputs(documentBody)
      log('inputElsArray', inputElsArray)

      if (inputElsArray.length === 1) {
        if (inputElsArray[0].type === 'password') {
          // this branch handles multi step google login pages specifically. We might add more cases in the future
          const visibleText = getAllVisibleTextOnDocumentBody()

          let matchingLogin =
            secretsForHost.loginCredentials.length === 1
              ? secretsForHost.loginCredentials[0]
              : secretsForHost.loginCredentials.find((login) => {
                  return visibleText.includes(login.loginCredentials.username)
                })
          if (!matchingLogin) {
            // some pages obscure the email visible on the page, for example  https://accounts.binance.com/en/login-password
            // for these we should autofill the login based on the last inputted username

            const storedVal = await browser.storage.local.get(
              'lastAutofilledValue'
            )

            matchingLogin = secretsForHost.loginCredentials.find((login) => {
              return (
                login.loginCredentials.username ===
                storedVal.lastAutofilledValue
              )
            })
          }

          if (matchingLogin) {
            const autofilledElPassword = fillPasswordIntoInput(
              inputElsArray[0],
              matchingLogin.loginCredentials
            )

            // TODO we should show a notification to let user know which login was used for autofill to prevent confusion when multiple logins are available and maybe some of them are wrong
            return autofilledElPassword
          }
        }
      } else {
        for (let index = 0; index < inputElsArray.length; index++) {
          const input = inputElsArray[index]
          if (input.type === 'password') {
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

            //Search for a username input by going backwards in the array from the password input
            for (let j = index - 1; j >= 0; j--) {
              if (inputElsArray[j].type !== 'hidden') {
                log('found username input', inputElsArray[j])

                //Save username input, if we have more credentials with no DOM PATH then break from loop and let user choose which psw to use
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
                const recentlyUsedLogin = secretsForHost.loginCredentials.sort(
                  (a, b) => {
                    return (a.lastUsedAt ?? '') > (b.lastUsedAt ?? '') ? -1 : 1
                  }
                )[0]

                const autofilledElUsername = autofillValueIntoInput(
                  inputElsArray[j],
                  recentlyUsedLogin.loginCredentials.username
                )

                domRecorder.addInputEvent({
                  element: inputElsArray[j],
                  eventType: 'input',
                  inputted: recentlyUsedLogin.loginCredentials.username,
                  kind: WebInputType.USERNAME
                })

                const autofilledElPassword = autofillValueIntoInput(
                  input,
                  recentlyUsedLogin.loginCredentials.password
                )

                domRecorder.addInputEvent({
                  element: input,
                  eventType: 'input',
                  inputted: recentlyUsedLogin.loginCredentials.password,
                  kind: WebInputType.PASSWORD
                })

                return !!autofilledElUsername || !!autofilledElPassword
              }
            }

            //Let user choose which credential to use
            if (secretsForHost.loginCredentials.length > 1) {
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
      }

      // we have not found any password inputs, let's try to find a username input as this could be a multi step login page where the password is entered later

      for (let index = 0; index < inputElsArray.length; index++) {
        const input = inputElsArray[index]

        if (
          input.autocomplete?.includes('username') ||
          input.autocomplete?.includes('email')
        ) {
          const recentlyUsedLogin = secretsForHost.loginCredentials.sort(
            (a, b) => {
              return (a.lastUsedAt ?? '') > (b.lastUsedAt ?? '') ? -1 : 1
            }
          )[0]

          const autofilledElUsername = autofillValueIntoInput(
            input,
            recentlyUsedLogin.loginCredentials.username
          )

          return !!autofilledElUsername
        }
      }
      return false
    }
  }

  const initAutofill = () => {
    scanKnownWebInputsAndFillWhenFound()

    //If input shows on loaded page

    bodyInputChangeEmitter.on('inputAdded', onInputAddedHandler)
  }
  const initTimeout = setTimeout(initAutofill, 150) // let's wait a bit for the page to load

  return () => {
    bodyInputChangeEmitter.off('inputAdded', initAutofill)
    clearTimeout(initTimeout)
    passwordFilledForThisPage = false
  }
}

export const debouncedAutofill = debounce(autofill, 300, {
  trailing: true,
  leading: false
})

function generatePasswordBasedOnUserConfig() {
  const config = {
    // TODO get config from device.state
    length: 12,
    numbers: true,
    uppercase: true,
    symbols: true,
    strict: true
  }
  return generate(config)
}
