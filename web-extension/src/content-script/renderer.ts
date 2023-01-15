import { domRecorder, getWebInputKind, IInitStateRes } from './contentScript'
import { renderLoginCredOption } from './renderLoginCredOption'
import {
  loginPrompt,
  renderSaveCredentialsForm
} from './renderSaveCredentialsForm'
import browser from 'webextension-polyfill'
import debug from 'debug'
import { BackgroundMessageType } from '../background/BackgroundMessageType'
import { IDecryptedSecrets } from './autofill'
import { renderItemPopup } from './renderItemPopup'
import { recordDiv, renderToast } from './renderToast'
const log = debug('au:contentScript:renderer')
localStorage.debug = localStorage.debug || 'au:*' // enable all debug messages, TODO remove this for production

let clickCount = 0
let recording = false

const hideToast = () => {
  const x = document.getElementById('toast')

  setTimeout(function () {
    x?.remove()
  }, 5000)
}

export function recordInputs(e?: KeyboardEvent) {
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

    //TODO: We can use inputs on page???
    renderItemPopup()
  }
}

export const renderer = (stateInit: IInitStateRes) => {
  const {
    saveLoginModalsState,
    secretsForHost,
    webInputs,
    passwordLimit,
    passwordCount
  } = stateInit

  if (secretsForHost.loginCredentials.length > 1 && webInputs.length > 0) {
    renderLoginCredOption({
      loginCredentials: secretsForHost.loginCredentials,
      webInputs
    })
    return
  }

  // Render save credential modal after page-rerender
  if (
    saveLoginModalsState &&
    saveLoginModalsState.username &&
    saveLoginModalsState.password
  ) {
    log('rendering save credentials form')
    renderSaveCredentialsForm(
      saveLoginModalsState.username,
      saveLoginModalsState.password,
      passwordLimit,
      passwordCount
    )
    return // the modal is already displayed
  }
}

export const showSavePromptIfAppropriate = async (
  secretsForHost: IDecryptedSecrets,
  passwordLimit: number,
  passwordCount: number
) => {
  log('showSavePromptIfAppropriate', domRecorder.toJSON(), document.documentURI)
  if (loginPrompt) {
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
      renderSaveCredentialsForm(
        username,
        password,
        passwordLimit,
        passwordCount
      )
    } else {
      const fallbackUsernames: string[] = await browser.runtime.sendMessage({
        action: BackgroundMessageType.getFallbackUsernames
      })
      renderSaveCredentialsForm(
        fallbackUsernames[0],
        password,
        passwordLimit,
        passwordCount
      )
    }
  }
}
