import { domRecorder, getWebInputKind, IInitStateRes } from './contentScript'
import { renderLoginCredOption } from './renderLoginCredOption'
import {
  loginPrompt,
  renderSaveCredentialsForm
} from './renderSaveCredentialsForm'

import debug from 'debug'

import { IDecryptedSecrets } from './autofill'
import { renderItemPopup } from './renderItemPopup'
import { recordDiv, renderToast } from './renderToast'
import { trpcCS } from './connectTRPC'

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

async function clicked(e: MouseEvent) {
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
    await trpcCS.saveCapturedInputEvents.mutate({
      inputEvents: domRecorder.toJSON(),
      url: document.documentURI
    })

    recordDiv?.remove()
    recording = false
    clickCount = 0
    document.removeEventListener('click', clicked)

    //TODO: We can use inputs on page???
    renderItemPopup()
  }
}

/**
 * this handles showing the login credential options modal and the save credentials top bar
 */
export const contentScriptRender = (stateInit: IInitStateRes) => {
  const { saveLoginModalsState, secretsForHost, webInputs } = stateInit

  if (secretsForHost.loginCredentials.length > 1 && webInputs.length > 0) {
    renderLoginCredOption({
      loginCredentials: secretsForHost.loginCredentials,
      webInputs
    })
    return
  }

  const isIframe = window.location !== window.parent.location
  if (isIframe) {
    return // don't show the save prompt in iframes, we only want to show it in the top-level page
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
      saveLoginModalsState.password
    )
    return // the modal is already displayed
  }
}

export const showSavePromptIfAppropriate = async (
  secretsForHost: IDecryptedSecrets
) => {
  log('showSavePromptIfAppropriate', domRecorder.toJSON(), document.documentURI)
  if (loginPrompt) {
    return
  }

  await trpcCS.saveCapturedInputEvents.mutate({
    inputEvents: domRecorder.toJSON(),
    url: document.documentURI
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
      // @ts-expect-error
      const fallbackUsernames: string[] =
        await trpcCS.getFallbackUsernames.query()
      log('fallbackUsernames', fallbackUsernames)
      renderSaveCredentialsForm(fallbackUsernames[0], password)
    }
  }
}
