// @ts-nocheck
import { h, render } from 'preact'
import { Toast } from './components/Toast'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let promptDiv: HTMLDivElement | null

export async function renderToast({
  header,
  text
}: {
  header: string
  text: string
}) {
  promptDiv = document.createElement('div')
  console.log(promptDiv)
  render(<Toast header={header} text={text} />, promptDiv)

  document.body.appendChild(promptDiv)
}
