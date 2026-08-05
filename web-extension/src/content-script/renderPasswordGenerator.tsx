import { h, render } from 'preact'
import { PromptPasswordGenerator } from './components/PromptPasswordGenerator'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let generatorDiv: HTMLDivElement | null

export function renderPasswordGenerator({
  input
}: {
  input: HTMLInputElement
}) {
  // pages can add password inputs repeatedly, don't stack a generator per call
  generatorDiv?.remove()
  generatorDiv = document.createElement('div')
  render(<PromptPasswordGenerator input={input} />, generatorDiv)

  document.body.appendChild(generatorDiv)
}
