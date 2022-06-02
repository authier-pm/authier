// @ts-nocheck
import { h, render } from 'preact'

import { Toast } from './components/Toast'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let promptOption: HTMLDivElement | null

export function renderRecordingStart() {
  promptOption = document.createElement('div')
  render(<Toast />, promptOption)

  document.body.appendChild(promptOption)
}
