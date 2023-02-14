// @ts-nocheck
import { h, render } from 'preact'
import { PrompItemPopup } from './components/PromptItemPopup'
import { getTRPCCached } from './connectTRPC'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let popupDiv: HTMLDivElement | null

export async function renderItemPopup() {
  const trpc = getTRPCCached()
  const inputEvents = await trpc.getCapturedInputEvents.query()

  popupDiv = document.createElement('div')
  render(<PrompItemPopup inputEvents={inputEvents} />, popupDiv)

  document.body.appendChild(popupDiv)
}
