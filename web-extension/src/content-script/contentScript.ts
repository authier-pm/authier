import { BackgroundMessageType } from '../background/BackgroundMessageType'
import { debounce } from 'lodash'
import browser from 'webextension-polyfill'

import {
  DOMEventsRecorder,
  getSelectorForElement,
  IInputRecord
} from './DOMEventsRecorder'
import debug from 'debug'
import {
  WebInputElement,
  WebInputType
} from '../../../shared/generated/graphqlBaseTypes'

import { bodyInputChangeEmitter } from './domMutationObserver'
import {
  autofill,
  autofillEventsDispatched,
  IDecryptedSecrets
} from './autofill'
import {
  promptDiv,
  renderSaveCredentialsForm
} from './renderSaveCredentialsForm'
import { authenticator } from 'otplib'
import { renderLoginCredOption } from './renderLoginCredOption'
import { recordDiv, renderToast } from './renderToast'
import { renderItemPopup } from './renderItemPopup'

const log = debug('au:contentScript')
localStorage.debug = localStorage.debug || 'au:*' // enable all debug messages, TODO remove this for production

const inputKindMap = {
  email: WebInputType.EMAIL,
  username: WebInputType.USERNAME
}

export interface IInitStateRes {
  extensionDeviceReady: boolean
  autofillEnabled: boolean
  secretsForHost: IDecryptedSecrets
  webInputs: Array<{
    __typename?: 'WebInputGQL'
    id?: number
    url: string
    host: string
    domPath: string
    kind: WebInputType
    createdAt: string
  }>
  saveLoginModalsState?:
    | {
        password: string
        username: string
      }
    | null
    | undefined
}

// TODO spec
export function getWebInputKind(
  targetElement: HTMLInputElement
): WebInputType | null {
  return (
    (targetElement.type === 'password'
      ? WebInputType.PASSWORD
      : inputKindMap[targetElement.autocomplete]) ?? 'USERNAME_OR_EMAIL'
  )
}

let clickCount = 0
let recording = false

const hideToast = () => {
  const x = document.getElementById('toast')

  setTimeout(function () {
    x?.remove()
  }, 5000)
}

function onKeyDown(e?: KeyboardEvent) {
  if (
    e &&
    e.shiftKey &&
    e.ctrlKey &&
    (e.key === 'q' || e.key === 'Q') &&
    !recording
  ) {
    recording = true
    renderToast({
      header: 'Recording started',
      text: 'Press Ctrl + shift + Q to stop'
    })

    document.addEventListener('click', clicked)
  } else if (
    e &&
    e.shiftKey &&
    e.ctrlKey &&
    (e.key === 'q' || e.key === 'Q') &&
    recording
  ) {
    domRecorder.clearCapturedEvents()
    document.removeEventListener('click', clicked)
    recordDiv?.remove()
    clickCount = 0
    recording = false
    hideToast()
  }
}

function clicked(e: MouseEvent) {
  console.log(e)

  //@ts-expect-error TODO
  if (e.target.type === 'password' || e.target.type === 'text') {
    domRecorder.addInputEvent({
      element: e.target as HTMLInputElement,
      eventType: 'input',
      kind: getWebInputKind(e.target as HTMLInputElement)
    })

    clickCount = clickCount + 1
  }

  if (clickCount === 2) {
    browser.runtime.sendMessage({
      action: BackgroundMessageType.saveCapturedInputEvents,
      payload: {
        inputEvents: domRecorder.toJSON(),
        url: document.documentURI
      }
    })

    recordDiv?.remove()
    recording = false
    clickCount = 0
    document.removeEventListener('click', clicked)

    renderItemPopup()
  }
}
export const domRecorder = new DOMEventsRecorder()

const formsRegisteredForSubmitEvent = [] as HTMLFormElement[]
let stateInitRes: IInitStateRes
export async function initInputWatch() {
  stateInitRes = await browser.runtime.sendMessage({
    action: BackgroundMessageType.getContentScriptInitialState
  })

  log('~ stateInitRes', stateInitRes)

  if (stateInitRes) {
    document.addEventListener('keydown', onKeyDown, true)
  }

  if (!stateInitRes) {
    log('no state')
    return
  }

  const {
    saveLoginModalsState,
    extensionDeviceReady,
    secretsForHost,
    autofillEnabled,
    webInputs
  } = stateInitRes

  if (!extensionDeviceReady || !autofillEnabled) {
    log('no need to do anything-user locked out')
    return // no need to do anything-user locked out
  }

  if (secretsForHost.loginCredentials.length > 1 && webInputs.length > 0) {
    renderLoginCredOption({
      loginCredentials: secretsForHost.loginCredentials,
      webInputs
    })
    return
  }
  const stopAutofillListener = autofill(stateInitRes)

  // Render save credential modal after page-rerender
  if (
    saveLoginModalsState &&
    saveLoginModalsState.username &&
    saveLoginModalsState.password
  ) {
    log('rendering save credentials form')
    renderSaveCredentialsForm(
      saveLoginModalsState.username,
      saveLoginModalsState.password
    )
    return // the modal is already displayed
  }

  const showSavePromptIfAppropriate = async () => {
    log('showSavePromptIfAppropriate', domRecorder.toJSON())
    if (promptDiv) {
      return
    }
    browser.runtime.sendMessage({
      action: BackgroundMessageType.saveCapturedInputEvents,
      payload: {
        inputEvents: domRecorder.toJSON(),
        url: document.documentURI
      }
    })
    const username = domRecorder.getUsername()
    const password = domRecorder.getPassword()

    const existingCredentialWithSamePassword =
      secretsForHost?.loginCredentials.find(
        ({ loginCredentials }) => loginCredentials.password === password
      )

    if (password && !existingCredentialWithSamePassword) {
      if (username) {
        renderSaveCredentialsForm(username, password)
      } else {
        const fallbackUsernames: string[] = await browser.runtime.sendMessage({
          action: BackgroundMessageType.getFallbackUsernames
        })
        renderSaveCredentialsForm(fallbackUsernames[0], password)
      }
    }
  }

  const onSubmit = (element: HTMLInputElement | HTMLFormElement) => {
    domRecorder.addInputEvent({
      element,
      eventType: 'submit',
      kind: WebInputType.SUBMIT_BUTTON
    })

    showSavePromptIfAppropriate()
  }

  const onInputRemoved = (input) => {
    // handle case when password input is removed from DOM by javascript
    if (input.type === 'password' && domRecorder.hasInput(input)) {
      onSubmit(input)
    }
  }

  bodyInputChangeEmitter.on('inputRemoved', onInputRemoved)

  /**
   * responsible for saving new web inputs
   */
  const debouncedInputEventListener = debounce((ev) => {
    log('Catched action', ev)
    if (autofillEventsDispatched.has(ev)) {
      // this was dispatched by autofill, we don't need to do anything here
      autofillEventsDispatched.delete(ev)
      return
    }
    const targetElement = ev.target as HTMLInputElement
    const isPasswordType = targetElement.type === 'password'

    const inputted = targetElement.value

    if (
      isPasswordType ||
      targetElement.type === 'text' ||
      targetElement.type === 'email'
    ) {
      if (inputted) {
        const inputRecord: IInputRecord = {
          element: targetElement,
          eventType: 'input',
          inputted,
          kind: getWebInputKind(targetElement)
        }
        domRecorder.addInputEvent(inputRecord)

        // TOTP Recognision
        if (inputted.length === 6 && secretsForHost.totpSecrets.length > 0) {
          // TODO if this is a number check existing TOTP and add TOTP web input if it matches the OTP input

          secretsForHost.totpSecrets.forEach(async (totpSecret) => {
            if (authenticator.generate(totpSecret.totp) === inputted) {
              const elementSelector = getSelectorForElement(
                targetElement as HTMLInputElement
              )
              const webInput: WebInputElement = {
                domPath: elementSelector.css,
                domOrdinal: elementSelector.ordinal,
                kind: WebInputType.TOTP,
                url: location.href
              }
              await browser.runtime.sendMessage({
                action: BackgroundMessageType.addTOTPInput,
                payload: webInput
              })
              log(`TOTP WebInput added for selector "${elementSelector}"`)
            }
          })
        }

        if (targetElement.type === 'password') {
          log('password inputted', inputted)

          const form = targetElement.form

          if (form) {
            // handle case when this is inside a form
            if (formsRegisteredForSubmitEvent.includes(targetElement.form)) {
              log('includes')
              return
            }

            form.addEventListener(
              'submit',
              (ev) => {
                onSubmit(form)
              },
              { once: true }
            )
            formsRegisteredForSubmitEvent.push(form)
          }

          // handle when the user uses enter key-custom JS might be listening for keydown as well and trigger submit externally
          targetElement.addEventListener(
            'keydown',
            (ev: KeyboardEvent) => {
              if (ev.code === 'Enter') {
                domRecorder.addInputEvent({
                  element: targetElement,
                  eventType: 'keydown',
                  kind: null
                })
                showSavePromptIfAppropriate()
              }
            },
            { once: true }
          )

          // some login flows don't have any forms, in that case we are listening for click, keydown
          targetElement.ownerDocument.body.addEventListener(
            'click',
            showSavePromptIfAppropriate,
            {
              once: true
            }
          )
        }
      }
    }
  }, 400)
  document.body.addEventListener('input', debouncedInputEventListener, true) // maybe there are websites where this won't work, we need to test this out larger number of websites

  return () => {
    document.body.removeEventListener(
      'input',
      debouncedInputEventListener,
      true
    )
    stopAutofillListener()
    bodyInputChangeEmitter.off('inputRemoved', onInputRemoved)
  }
}

initInputWatch()

// document.addEventListener('readystatechange', (event) => {
//   if (
//     event.target instanceof Document &&
//     event.target?.readyState === 'complete'
//   ) {
//     initInputWatch()
//   }
// })
