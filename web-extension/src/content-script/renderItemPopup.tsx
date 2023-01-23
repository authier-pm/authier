// @ts-nocheck
import { h, render } from 'preact'
import { PrompItemPopup } from './components/PromptItemPopup'
import { trpc } from './contentScript'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let popupDiv: HTMLDivElement | null

export async function renderItemPopup() {
  const inputEvents = await trpc.getCapturedInputEvents.query()

  popupDiv = document.createElement('div')
  render(<PrompItemPopup inputEvents={inputEvents} />, popupDiv)

  document.body.appendChild(popupDiv)
}
