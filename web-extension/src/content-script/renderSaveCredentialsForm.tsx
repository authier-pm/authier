import { PromptPassword } from './components/PromptPassword'
import { BackgroundMessageType } from '../background/BackgroundMessageType'
import browser from 'webextension-polyfill'
import { domRecorder } from './contentScript'

import { h, render } from 'nano-jsx/lib/core'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let promptDiv: HTMLDivElement | null

export function renderSaveCredentialsForm(username: string, password: string) {
  promptDiv = document.createElement('div')
  render(<PromptPassword username={username} password={password} />, promptDiv)

  document.body.appendChild(promptDiv)

  browser.runtime.sendMessage({
    action: BackgroundMessageType.saveLoginCredentialsModalShown,
    payload: {
      username,
      password,
      capturedInputEvents: domRecorder.toJSON()
    }
  })
}
