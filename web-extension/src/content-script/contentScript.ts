import { debounce } from 'lodash'

import { DOMEventsRecorder, IInputRecord } from './DOMEventsRecorder'
import debug from 'debug'
import {
  WebInputElement,
  WebInputType
} from '../../../shared/generated/graphqlBaseTypes'

import {
  bodyInputChangeEmitter,
  startBodyInputChangeObserver
} from './domMutationObserver'
import {
  autofill,
  autofillEventsDispatched,
  autofillValueIntoInput,
  debouncedAutofill,
  IDecryptedSecrets
} from './autofill'
import { authenticator } from 'otplib'
import {
  recordInputs,
  contentScriptRender,
  showSavePromptIfAppropriate
} from './contentScriptRender'

import type { ISaveLoginModalState } from '../background/chromeRuntimeListener'
import { trpc } from './connectTRPC'
import { notyf } from './notyf'
import browser from 'webextension-polyfill'
import { PopupActionsEnum } from '../components/pages/PopupActionsEnum'
import { getSelectorForElement } from './cssSelectorGenerators'
import { WebInputForAutofill } from '../background/WebInputForAutofill'

const log = debug('au:contentScript')
localStorage.debug = localStorage.debug || 'au:*' // enable all debug messages, TODO remove this for production

const inputKindMap = {
  email: WebInputType.EMAIL,
  username: WebInputType.USERNAME
}

export interface Coords {
  x: number
  y: number
}

export interface IInitStateRes {
  extensionDeviceReady: boolean
  autofillEnabled: boolean
  secretsForHost: IDecryptedSecrets
  passwordCount: number
  webInputs: Array<WebInputForAutofill>
  saveLoginModalsState?: ISaveLoginModalState | null | undefined
}

// TODO spec
export function getWebInputKind(targetElement: HTMLInputElement): WebInputType {
  return (
    (targetElement.type === 'password'
      ? WebInputType.PASSWORD
      : inputKindMap[targetElement.autocomplete]) ??
    WebInputType.USERNAME_OR_EMAIL
  )
}

export const domRecorder = new DOMEventsRecorder()

const formsRegisteredForSubmitEvent = [] as HTMLFormElement[]
export let stateInitRes: IInitStateRes | null = null

export async function initInputWatch() {
  stateInitRes = await trpc.getContentScriptInitialState.query()

  log('~ stateInitRes', stateInitRes)

  if (!stateInitRes) {
    log('no state')
    return
  }

  document.addEventListener('keydown', recordInputs, true)

  const { extensionDeviceReady, secretsForHost, autofillEnabled } = stateInitRes

  if (!extensionDeviceReady || !autofillEnabled) {
    log('no need to do anything-user locked out')
    return
  }

  startBodyInputChangeObserver()
  contentScriptRender(stateInitRes)

  const stopAutofillListener = autofill(stateInitRes)

  const onSubmit = (element: HTMLInputElement | HTMLFormElement) => {
    domRecorder.addInputEvent({
      element,
      eventType: 'submit',
      kind: WebInputType.SUBMIT_BUTTON
    })

    showSavePromptIfAppropriate(secretsForHost)
  }

  const onInputRemoved = (input: HTMLInputElement) => {
    // handle case when password input is removed from DOM by javascript
    if (input.type === 'password' && domRecorder.hasInput(input)) {
      onSubmit(input)
    }
  }

  const onInputAdded = (input: HTMLInputElement) => {
    // handle case when password input is added to DOM by javascript
    if (
      input.type === 'password' &&
      !domRecorder.hasInput(input) &&
      stateInitRes
    ) {
      debouncedAutofill(stateInitRes)
    }
  }

  bodyInputChangeEmitter.on('inputRemoved', onInputRemoved)
  bodyInputChangeEmitter.on('inputAdded', onInputAdded)

  /**
   * responsible for saving new web inputs
   */
  const debouncedInputEventListener = debounce((ev) => {
    log('Caught action', ev, ev.type)
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
                showSavePromptIfAppropriate(secretsForHost)
              }
            },
            { once: true }
          )

          // some login flows don't have any forms, in that case we are listening for click, keydown
          targetElement.ownerDocument.body.addEventListener(
            'click',
            () => showSavePromptIfAppropriate(secretsForHost),
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
    bodyInputChangeEmitter.off('inputAdded', onInputAdded)
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

// For SPA websites https://stackoverflow.com/questions/2844565/is-there-a-javascript-jquery-dom-change-listener/39508954#39508954
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    initInputWatch()
  }
}).observe(document, { subtree: true, childList: true })

browser.runtime.onMessage.addListener(
  // @ts-expect-error
  (message: {
    kind: PopupActionsEnum
    event?: { otpCode: string; secretId: string }
  }) => {
    if (message.kind === PopupActionsEnum.TOTP_COPIED) {
      async function elementSelected(event) {
        event.preventDefault()
        event.stopPropagation() // Stop the event from propagating further

        document.removeEventListener('click', elementSelected, true) // Remove the event listener

        const selectedElement = event.target // Correctly gets the clicked element
        if (selectedElement.tagName !== 'INPUT') {
          notyf.error('You must select an input element')
        }
        selectedElement.style.backgroundColor = 'yellow' // Highlight the selected element

        const elementSelector = getSelectorForElement(selectedElement)
        const webInput: WebInputElement = {
          domPath: elementSelector.css,
          domOrdinal: elementSelector.domOrdinal,
          kind: WebInputType.TOTP,
          url: location.href
        }
        await trpc.addTOTPInput.mutate(webInput)
        const messageEvent = message.event

        if (messageEvent?.otpCode) {
          autofillValueIntoInput(selectedElement, messageEvent?.otpCode)
          notyf.success(
            `TOTP WebInput added for selector "${elementSelector.css}"`
          )
        }
      }

      document.addEventListener('click', elementSelected, true) // Use capturing to handle the event first
    }
  }
)
