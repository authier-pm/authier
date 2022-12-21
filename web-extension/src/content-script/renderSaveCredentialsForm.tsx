// @ts-nocheck
import { PromptPassword } from './components/PromptPassword'
import { BackgroundMessageType } from '../background/BackgroundMessageType'
import browser from 'webextension-polyfill'
import { h, render } from 'preact'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let promptDiv: HTMLDivElement | null

export async function renderSaveCredentialsForm(
  username: string,
  password: string,
  passwordLimit: number,
  passwordCount: number
) {
  const inputEvents = await browser.runtime.sendMessage({
    action: BackgroundMessageType.getCapturedInputEvents
  })

  promptDiv = document.createElement('div')
  render(
    <PromptPassword
      username={username}
      password={password}
      inputEvents={inputEvents}
      passwordLimit={passwordLimit}
      passwordCount={passwordCount}
    />,
    promptDiv
  )

  document.body.appendChild(promptDiv)

  browser.runtime.sendMessage({
    action: BackgroundMessageType.saveLoginCredentialsModalShown,
    payload: {
      username,
      password
    }
  })
}
