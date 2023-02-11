// @ts-nocheck
import { PromptPassword } from './components/PromptPassword'
import { h, render } from 'preact'
import { BackgroundMessageType } from '../background/BackgroundMessageType'
import browser from 'webextension-polyfill'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let loginPrompt: HTMLDivElement | null

export async function renderSaveCredentialsForm(
  username: string,
  password: string,
  passwordLimit: number,
  passwordCount: number
) {
  const inputEvents = await browser.runtime.sendMessage({
    action: BackgroundMessageType.getCapturedInputEvents
  })

  loginPrompt = document.createElement('div')
  render(
    <PromptPassword
      username={username}
      password={password}
      inputEvents={inputEvents}
      passwordLimit={passwordLimit}
      passwordCount={passwordCount}
    />,
    loginPrompt
  )

  document.body.appendChild(loginPrompt)

  browser.runtime.sendMessage({
    action: BackgroundMessageType.saveLoginCredentialsModalShown,
    payload: {
      username,
      password
    }
  })
}
