/** @jsxImportSource preact */
import { render } from 'preact'
import { PromptItemPopup } from './components/PromptItemPopup'
import { trpc } from './connectTRPC'
import { contentVaultSignal } from './contentVaultSession'

export let popupDiv: HTMLDivElement | null

export const removeItemPopup = () => {
  if (popupDiv) render(null, popupDiv)
  popupDiv?.remove()
  popupDiv = null
}

export async function renderItemPopup() {
  const signal = contentVaultSignal()
  const inputEvents = await trpc.getCapturedInputEvents.query()
  if (signal.aborted) return
  removeItemPopup()

  popupDiv = document.createElement('div')
  render(<PromptItemPopup inputEvents={inputEvents} />, popupDiv)

  document.body.appendChild(popupDiv)
}
