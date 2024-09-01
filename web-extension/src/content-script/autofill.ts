import { bodyInputChangeEmitter } from './domMutationObserver'
import { authenticator } from 'otplib'
import debug from 'debug'
import { generate } from 'generate-password'
import { isElementInViewport, isHidden } from './isElementInViewport'
import { domRecorder, IInitStateRes } from './contentScript'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { authierColors } from '../../../shared/chakraRawTheme'
import 'notyf/notyf.min.css'
import { debounce } from 'lodash'
import { renderLoginCredOption } from './renderLoginCredOption'

import {
  ILoginSecret,
  ITOTPSecret,
  LoginCredentialsTypeWithMeta
} from '../util/useDeviceState'
import { renderPasswordGenerator } from './renderPasswordGenerator'
import { trpc } from './connectTRPC'
import { getAllVisibleTextOnDocumentBody } from './getAllVisibleTextOnDocumentBody'
import { renderSaveCredentialsForm } from './renderSaveCredentialsForm'

import browser from 'webextension-polyfill'
import {
  generateQuerySelectorForOrphanedElement,
  getSelectorForElement
} from './cssSelectorGenerators'
import { notyf } from './notyf'
import { WebInputForAutofill } from '../background/WebInputForAutofill'
import { wait } from './wait'

const log = debug('au:autofill')

export type IDecryptedSecrets = {
  loginCredentials: ILoginSecret[]
  totpSecrets: ITOTPSecret[]
}

export const autofillEventsDispatched = new Set()

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
    if (el.value === input) {
      return
    }

    if (el.value !== '') {
      el.value = '' // reset if there is already some value
    }
    const dispatchAutofillEvent = (ev) => {
      autofillEventsDispatched.add(ev)
      el.dispatchEvent(ev)
    }
    // dispatch focus event

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

      dispatchAutofillEvent(keyDown)

      const keyPress = new KeyboardEvent('keypress', keyboardEventInit)

      dispatchAutofillEvent(keyPress)

      const keyUp = new KeyboardEvent('keyup', keyboardEventInit)

      dispatchAutofillEvent(keyUp)
      el.value += key

      const change = new Event('change', { bubbles: true })

      dispatchAutofillEvent(change)
      // await sleep(2) // this is to make it a bit more realistic
    }

    const inputEvent = new Event('input', { bubbles: true })
    dispatchAutofillEvent(inputEvent)

    const blurEvent = new Event('blur', { bubbles: true }) // this is needed, because some websites actually trigger form validation on blur. for example coinmate.io
    dispatchAutofillEvent(blurEvent)
  } else {
    console.error('el is null')
  }
}

export const autofillValueIntoInput = (
  element: HTMLInputElement,
  value: string
) => {
  log('autofillValueIntoInput:', value, element)

  if (filledElements.has(element)) {
    return null
  }
  if (element.childNodes.length > 0) {
    //we should again loop through the children of the element and find the right input
    //@ts-ignore
    imitateKeyInput(element.childNodes[0], value)
    filledElements.add(element)
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
  filledElements.add(element)

  return element
}

export const fillStringIntoInput = ({
  inputEl,
  loginCredential,
  inputType
}: {
  inputEl: HTMLInputElement
  loginCredential: LoginCredentialsTypeWithMeta

  inputType: WebInputType
}) => {
  if (inputTypesFilledForThisPage.has(inputType)) {
    log(`inputType ${inputType} already filled for this page`)
    return
  }

  inputTypesFilledForThisPage.add(inputType)

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

let onInputAddedHandler = (inputEl: any) => {}

/**
 * tracks which input types have been autofilled for this page, so we don't autofill them again
 */
export let inputTypesFilledForThisPage = new Set<WebInputType>()

/**
 * tracks autofilled elements, so we don't autofill them again. We clear this set when user decides to autofill again with different credentials
 */
export const filledElements = new Set<HTMLInputElement>()

export const resetAutofillStateForThisPage = () => {
  for (const el of filledElements) {
    el.value = ''
  }
  inputTypesFilledForThisPage.clear()
  filledElements.clear()
}

export const autofill = (initState: IInitStateRes) => {
  const { secretsForHost, webInputs } = initState

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

    // Fill known inputs
    let foundInputsCount = 0
    for (const webInputGql of webInputs) {
      const inputElList = body.querySelectorAll(
        webInputGql.domPath
      ) as NodeListOf<HTMLInputElement>

      const inputEl = inputElList[webInputGql.domOrdinal]

      //NOTE: We found element by DOM path
      if (inputEl) {
        // log('webInputGql was found')

        foundInputsCount++
        log(`autofilled by domPath ${webInputGql.domPath}`)
        if (
          webInputGql.kind === WebInputType.PASSWORD &&
          firstLoginCred &&
          inputEl.type === 'password' // we don't want to autofill password to any other type of input
        ) {
          const el = fillStringIntoInput({
            inputEl,
            loginCredential: firstLoginCred.loginCredentials,
            inputType: webInputGql.kind
          })

          el && filledElements.add(el)
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
          el && filledElements.add(el)
        } else if (webInputGql.kind === WebInputType.TOTP) {
          if (!totpSecret) {
            log('no totp secret')
            return
          }
          const el = autofillValueIntoInput(
            inputEl,
            authenticator.generate(totpSecret.totp.secret)
          )
          el && filledElements.add(el)
        }

        if (filledElements.size >= 2) {
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

    //TODO: write a test for this
    // Catch new inputs
    onInputAddedHandler = debounce(
      (inputEl) => {
        if (filledElements.size >= 2) {
          return // we have already filled 2 inputs on this page, we don't need to fill any more
        }
        log('onInputAddedHandler', inputEl)
        const newPassword: string | null = null
        // For one input on page
        if (inputEl.type === 'username' || inputEl.type === 'email') {
          if (secretsForHost.loginCredentials.length === 1) {
            fillStringIntoInput({
              inputEl,
              loginCredential: firstLoginCred.loginCredentials,
              inputType: WebInputType.USERNAME
            })
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

    if (filledElements.size === 2) {
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
          form.submit.dispatchEvent(clickEvent)
        }

        let notAPasswordInput: HTMLInputElement | null = null

        for (const el of filledElements) {
          if (el?.type !== 'password') {
            notAPasswordInput = el
            break
          }
        }

        if (notAPasswordInput) {
          notyf.success(
            `Submitted autofilled form for user "${notAPasswordInput[0].value}}"`
          )
        }
      }
    }

    async function searchInputsAndAutofill(documentBody: HTMLElement) {
      const newWebInputs: Array<
        Omit<WebInputForAutofill, '__typename' | 'id'>
      > = []
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
            const autofilledElPassword = fillStringIntoInput({
              inputEl: inputElsArray[0],
              loginCredential: matchingLogin.loginCredentials,
              inputType: WebInputType.PASSWORD
            })

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
              const selector = getSelectorForElement(input)
              newWebInputs.push({
                createdAt: new Date().toString(),
                domPath: selector.css,
                domOrdinal: selector.domOrdinal,
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
                  const selector = getSelectorForElement(inputElsArray[j])
                  newWebInputs.push({
                    createdAt: new Date().toString(),
                    domPath: selector.css,
                    domOrdinal: selector.domOrdinal,
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
    inputTypesFilledForThisPage.clear()
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
