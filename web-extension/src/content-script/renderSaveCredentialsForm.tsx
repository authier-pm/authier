import { h, render } from 'preact'
import { PromptPassword } from './components/PromptPassword'
import { trpc } from './connectTRPC'
import {
  getSingleVisibleEmailFromPage,
  getUsernameFromCapturedInputs
} from './DOMEventsRecorder'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let loginPrompt: HTMLDivElement | null

export async function renderSaveCredentialsForm(
  username: string | null,
  password: string
) {
  const inputEvents = await trpc.getCapturedInputEvents.query()
  const resolvedUsername =
    username ??
    getUsernameFromCapturedInputs(inputEvents.capturedInputEvents) ??
    getSingleVisibleEmailFromPage(document.body.innerText, location.hostname) ??
    null
  if (loginPrompt) {
    loginPrompt.remove() // remove if already in the page
  }

  const newDiv = document.createElement('div')
  newDiv.id = 'authier-save-prompt'
  loginPrompt = newDiv

  // Create shadow root
  const shadow = newDiv.attachShadow({ mode: 'closed' })

  // Add base styles to shadow DOM
  const style = document.createElement('style')
  style.textContent = `
    :host {
      all: initial;
      position: fixed !important;
      z-index: 2147483647 !important;
      font-family: system-ui, -apple-system, sans-serif;
    }
  `
  shadow.appendChild(style)

  // Create container for Preact render
  const container = document.createElement('div')
  shadow.appendChild(container)

  render(
    <PromptPassword
      username={resolvedUsername}
      password={password}
      // @ts-expect-error TODO fix
      inputEvents={inputEvents}
    />,
    container
  )

  document.body.appendChild(loginPrompt)

  await trpc.saveLoginCredentialsModalShown.mutate({
    username: resolvedUsername,
    password
  })
}
