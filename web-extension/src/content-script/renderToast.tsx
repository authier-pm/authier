import { h, render } from 'preact'
import { Toast } from './components/Toast'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let recordDiv: HTMLDivElement | null

export async function renderToast({
  header,
  text
}: {
  header: string
  text: string
}) {
  recordDiv = document.createElement('div')

  render(<Toast header={header} text={text} />, recordDiv)

  document.body.appendChild(recordDiv)
}
