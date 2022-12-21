// @ts-nocheck
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
  console.log('PEPA')
  generatorDiv = document.createElement('div')
  render(<PromptPasswordGenerator input={input} />, generatorDiv)

  document.body.appendChild(generatorDiv)
}
