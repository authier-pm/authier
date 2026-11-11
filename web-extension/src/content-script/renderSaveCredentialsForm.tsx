/** @jsxImportSource preact */
import { render } from 'preact'
import { PromptPassword } from './components/PromptPassword'
import { trpc } from './connectTRPC'
import { contentVaultSignal } from './contentVaultSession'
import {
  getSingleVisibleEmailFromPage,
  getUsernameFromCapturedInputs
} from './DOMEventsRecorder'

export let loginPrompt: HTMLDivElement | null
let promptContainer: HTMLDivElement | null = null

export const removeSaveCredentialsForm = () => {
  if (promptContainer) render(null, promptContainer)
  loginPrompt?.remove()
  loginPrompt = null
  promptContainer = null
}

export async function renderSaveCredentialsForm(
  username: string | null,
  password: string
) {
  const signal = contentVaultSignal()
  const inputEvents = await trpc.getCapturedInputEvents.query()
  if (signal.aborted) return
  const resolvedUsername =
    username ??
    getUsernameFromCapturedInputs(inputEvents.capturedInputEvents) ??
    getSingleVisibleEmailFromPage(document.body.innerText, location.hostname) ??
    null
  removeSaveCredentialsForm()

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
  promptContainer = container
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
