// @ts-nocheck
import { PromptPassword } from './components/PromptPassword'
import { BackgroundMessageType } from '../background/BackgroundMessageType'
import browser from 'webextension-polyfill'
import { h, render } from 'preact'
import { PrompItemPopup } from './components/PromptItemPopup'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let popupDiv: HTMLDivElement | null

export async function renderItemPopup() {
  const inputEvents = await browser.runtime.sendMessage({
    action: BackgroundMessageType.getCapturedInputEvents
  })

  popupDiv = document.createElement('div')
  render(<PrompItemPopup inputEvents={inputEvents} />, popupDiv)

  document.body.appendChild(popupDiv)
}