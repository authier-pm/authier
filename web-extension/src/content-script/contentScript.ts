import { debounce } from 'lodash'

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

import {
  bodyInputChangeEmitter,
  startBodyInputChangeObserver
} from './domMutationObserver'
import {
  autofill,
  autofillEventsDispatched,
  getElementCoordinates,
  IDecryptedSecrets
} from './autofill'
import { authenticator } from 'otplib'
import { recordInputs, renderer, showSavePromptIfAppropriate } from './renderer'
import { getTRPCCached } from './connectTRPC'

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
  passwordLimit: number
  webInputs: Array<{
    __typename?: 'WebInputGQL'
    id?: number
    url: string
    host: string
    domPath: string
    kind: WebInputType
    createdAt: string
    domCoordinates: Coords
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

export const domRecorder = new DOMEventsRecorder()

const formsRegisteredForSubmitEvent = [] as HTMLFormElement[]
export let stateInitRes: IInitStateRes
export async function initInputWatch() {
  const trpc = getTRPCCached()
  stateInitRes =
    (await trpc.getContentScriptInitialState.query()) as IInitStateRes

  log('~ stateInitRes', stateInitRes)

  if (stateInitRes) {
    log('Press key')
    document.addEventListener('keydown', recordInputs, true)
  }

  if (!stateInitRes) {
    log('no state')
    return
  }

  const { extensionDeviceReady, secretsForHost, autofillEnabled } = stateInitRes

  if (!extensionDeviceReady || !autofillEnabled) {
    log('no need to do anything-user locked out')
    return
  }

  startBodyInputChangeObserver()
  renderer(stateInitRes)

  const stopAutofillListener = autofill(stateInitRes)

  const onSubmit = (element: HTMLInputElement | HTMLFormElement) => {
    domRecorder.addInputEvent({
      element,
      eventType: 'submit',
      kind: WebInputType.SUBMIT_BUTTON
    })

    showSavePromptIfAppropriate(secretsForHost)
  }

  const onInputRemoved = (input) => {
    // handle case when password input is removed from DOM by javascript
    if (input.type === 'password' && domRecorder.hasInput(input)) {
      onSubmit(input)
    }
  }

  const onInputAdded = (input) => {
    // handle case when password input is added to DOM by javascript
    if (input.type === 'password' && !domRecorder.hasInput(input)) {
      autofill(stateInitRes)
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

        // TOTP Recognition
        if (inputted.length === 6 && secretsForHost.totpSecrets.length > 0) {
          // TODO if this is a number check existing TOTP and add TOTP web input if it matches the OTP input

          secretsForHost.totpSecrets.forEach(async (totpSecret) => {
            if (authenticator.generate(totpSecret.totp.secret) === inputted) {
              const elementSelector = getSelectorForElement(
                targetElement as HTMLInputElement
              )
              const webInput: WebInputElement = {
                domPath: elementSelector.css,
                domOrdinal: elementSelector.domOrdinal,
                kind: WebInputType.TOTP,
                url: location.href,
                domCoordinates: getElementCoordinates(targetElement)
              }
              await trpc.addTOTPInput.mutate(webInput)
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
