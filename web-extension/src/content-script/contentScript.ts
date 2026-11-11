import { debounce } from 'lodash'
import { initializeTotpAccountEmail } from './totpAccountEmail'

import {
  DOMEventsRecorder,
  IInputRecord,
  isLikelyEmail
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
  autofillValueIntoInput,
  debouncedAutofill,
  filledElements,
  inputTypesFilledForThisPage,
  IDecryptedSecrets
} from './autofill'
import {
  recordInputs,
  contentScriptRender,
  stopRecordingInputs,
  showSavePromptIfAppropriate
} from './contentScriptRender'

import type { ISaveLoginModalState } from '../background/chromeRuntimeListener'
import { trpc } from './connectTRPC'
import { notyf } from './notyf'
import browser from 'webextension-polyfill'
import { PopupActionsEnum } from '../components/pages/PopupActionsEnum'
import { getSelectorForElement } from './cssSelectorGenerators'
import { WebInputsArrayClientSide } from '../background/WebInputForAutofill'
import { isAutofillPagePauseRefreshMessage } from '../background/autofillPagePause'
import { removeLoginCredOption } from './renderLoginCredOption'
import { startVerificationCodePicker } from './renderVerificationCodePicker'
import { removeSaveCredentialsForm } from './renderSaveCredentialsForm'
import { removePasswordGenerator } from './renderPasswordGenerator'
import { removeItemPopup } from './renderItemPopup'
import { isVaultLockMessage } from '../util/vaultLockMessage'
import {
  contentVaultSignal,
  invalidateContentVaultSession
} from './contentVaultSession'

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
  webInputs: WebInputsArrayClientSide
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

type TotpFillOnClickMessage = {
  kind: PopupActionsEnum.TOTP_FILL_ON_CLICK
  event?: { otpCode: string; secretId: string }
}

const isTotpFillOnClickMessage = (
  message: unknown
): message is TotpFillOnClickMessage => {
  if (
    typeof message !== 'object' ||
    message === null ||
    !('kind' in message) ||
    message.kind !== PopupActionsEnum.TOTP_FILL_ON_CLICK
  ) {
    return false
  }

  if (!('event' in message) || message.event === undefined) {
    return true
  }

  return (
    typeof message.event === 'object' &&
    message.event !== null &&
    'otpCode' in message.event &&
    typeof message.event.otpCode === 'string' &&
    'secretId' in message.event &&
    typeof message.event.secretId === 'string'
  )
}

export let stateInitRes: IInitStateRes | null = null

const shouldRecordInput = (targetElement: HTMLInputElement) => {
  return (
    targetElement.type === 'password' ||
    targetElement.type === 'text' ||
    targetElement.type === 'email'
  )
}

const captureInputValue = (targetElement: HTMLInputElement) => {
  if (!shouldRecordInput(targetElement) || !targetElement.value) {
    return false
  }

  const inputRecord: IInputRecord = {
    element: targetElement,
    eventType: 'input',
    inputted: targetElement.value,
    kind: getWebInputKind(targetElement)
  }
  domRecorder.addInputEvent(inputRecord)

  return true
}

const persistCapturedInputs = () => {
  void trpc.saveCapturedInputEvents.mutate({
    inputEvents: domRecorder.toJSON(),
    url: document.documentURI
  })
}

export async function initInputWatch(shouldStart: () => boolean = () => true) {
  const signal = contentVaultSignal()
  const nextState = await trpc.getContentScriptInitialState.query(location.href)

  if (signal.aborted || !shouldStart()) {
    return
  }

  stateInitRes = nextState

  if (!stateInitRes) {
    log('no state')
    return
  }

  const { extensionDeviceReady, secretsForHost, autofillEnabled } = stateInitRes

  if (!extensionDeviceReady || !autofillEnabled) {
    log('no need to do anything-user locked out')
    return
  }
  const formsRegisteredForSubmitEvent = new Set<HTMLFormElement>()

  document.addEventListener('keydown', recordInputs, true)

  const bodyInputChangeObserver = startBodyInputChangeObserver()
  contentScriptRender(stateInitRes)
  const stopVerificationCodePicker =
    window === window.top && location.protocol === 'https:'
      ? startVerificationCodePicker(autofillEventsDispatched)
      : () => undefined

  const stopAutofillListener = autofill(stateInitRes)

  const onSubmit = (element: HTMLInputElement | HTMLFormElement) => {
    if (signal.aborted) return
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
    if (signal.aborted) return
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
   *
   * TODO fix when inputs are wrapped in shadow DOM. In those cases we get the ev.target as shadow root and inside there can be multiple inputs.
   * this is an issue on github.com for example.
   */
  const debouncedInputEventListener = debounce((ev) => {
    if (signal.aborted) return
    log('Caught action', ev, ev.type)
    if (autofillEventsDispatched.has(ev)) {
      // this was dispatched by autofill, we don't need to do anything here
      autofillEventsDispatched.delete(ev)
      return
    }
    const targetElement = ev.target as HTMLInputElement

    if (captureInputValue(targetElement) && targetElement.type === 'password') {
      const form = targetElement.form

      if (form) {
        // handle case when this is inside a form
        if (formsRegisteredForSubmitEvent.has(form)) {
          log('includes')
          return
        }

        form.addEventListener(
          'submit',
          () => {
            onSubmit(form)
          },
          { once: true, signal }
        )
        formsRegisteredForSubmitEvent.add(form)
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
        { once: true, signal }
      )

      // some login flows don't have any forms, in that case we are listening for click, keydown
      targetElement.ownerDocument.body.addEventListener(
        'click',
        () => showSavePromptIfAppropriate(secretsForHost),
        {
          once: true,
          signal
        }
      )
    }
  }, 400)
  const focusoutEventListener = (ev: FocusEvent) => {
    if (signal.aborted) return
    const targetElement = ev.target

    if (!(targetElement instanceof HTMLInputElement)) {
      return
    }

    if (!captureInputValue(targetElement)) {
      return
    }

    if (isLikelyEmail(targetElement.value)) {
      persistCapturedInputs()
    }
  }
  document.body.addEventListener('input', debouncedInputEventListener, true) // maybe there are websites where this won't work, we need to test this out larger number of websites
  document.body.addEventListener('focusout', focusoutEventListener, true)

  return () => {
    formsRegisteredForSubmitEvent.clear()
    document.removeEventListener('keydown', recordInputs, true)
    document.body.removeEventListener(
      'input',
      debouncedInputEventListener,
      true
    )
    document.body.removeEventListener('focusout', focusoutEventListener, true)
    debouncedInputEventListener.cancel()
    debouncedAutofill.cancel()

    stopAutofillListener()
    stopVerificationCodePicker()
    bodyInputChangeObserver.disconnect()
    bodyInputChangeEmitter.off('inputRemoved', onInputRemoved)
    bodyInputChangeEmitter.off('inputAdded', onInputAdded)
    removeLoginCredOption()
  }
}

let inputWatchCleanup: (() => void) | undefined
let inputWatchGeneration = 0

export const clearContentScriptVault = () => {
  inputWatchGeneration += 1
  invalidateContentVaultSession()
  inputWatchCleanup?.()
  inputWatchCleanup = undefined
  debouncedAutofill.cancel()
  stateInitRes = null
  domRecorder.clearCapturedEvents()
  autofillEventsDispatched.clear()
  filledElements.clear()
  inputTypesFilledForThisPage.clear()
  stopRecordingInputs()
  removeLoginCredOption()
  removeSaveCredentialsForm()
  removePasswordGenerator()
  removeItemPopup()
}

export const refreshInputWatch = async () => {
  clearContentScriptVault()
  const generation = inputWatchGeneration

  const nextCleanup = await initInputWatch(
    () => generation === inputWatchGeneration
  )
  if (generation !== inputWatchGeneration) {
    return
  }

  inputWatchCleanup = nextCleanup
}

initializeTotpAccountEmail()
void refreshInputWatch()

// Frozen back/forward-cache documents may miss background lock messages.
// Discard plaintext before suspension and re-check the vault when restored.
window.addEventListener('pagehide', clearContentScriptVault)
window.addEventListener('pageshow', (event) => {
  if (event.persisted) void refreshInputWatch()
})

// For SPA websites https://stackoverflow.com/questions/2844565/is-there-a-javascript-jquery-dom-change-listener/39508954#39508954
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    void refreshInputWatch()
  }
}).observe(document, { subtree: true, childList: true })

browser.runtime.onMessage.addListener((message: unknown, sender) => {
  if (sender.id !== browser.runtime.id) return
  if (isVaultLockMessage(message)) {
    clearContentScriptVault()
    return
  }
  if (isAutofillPagePauseRefreshMessage(message)) {
    void refreshInputWatch()
    return
  }

  if (!isTotpFillOnClickMessage(message)) {
    return
  }
  if (!stateInitRes?.extensionDeviceReady) return
  const signal = contentVaultSignal()

  const totpMessage = message

  if (totpMessage.kind === PopupActionsEnum.TOTP_FILL_ON_CLICK) {
    async function elementSelected(event) {
      if (signal.aborted) return
      event.preventDefault()
      event.stopPropagation() // Stop the event from propagating further

      document.removeEventListener('click', elementSelected, true) // Remove the event listener

      const selectedElement = event.target // Correctly gets the clicked element
      if (selectedElement.tagName !== 'INPUT') {
        notyf.error('You must select an input element')
        return
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
      if (signal.aborted) return
      const messageEvent = totpMessage.event

      if (messageEvent?.otpCode) {
        autofillValueIntoInput(selectedElement, messageEvent?.otpCode)
        notyf.success(
          `TOTP WebInput added for selector "${elementSelector.css}"`
        )
      }
    }

    document.addEventListener('click', elementSelected, {
      capture: true,
      signal
    })
  }
})
