import { h, render } from 'preact'
import { PromptItemPopup } from './components/PromptItemPopup'
import { trpcCS } from './connectTRPC'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let popupDiv: HTMLDivElement | null

export async function renderItemPopup() {
  const inputEvents = await trpcCS.getCapturedInputEvents.query()

  popupDiv = document.createElement('div')
  render(<PromptItemPopup inputEvents={inputEvents} />, popupDiv)

  document.body.appendChild(popupDiv)
}
