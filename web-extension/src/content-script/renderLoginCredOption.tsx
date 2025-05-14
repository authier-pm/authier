import { h, render } from 'preact'
import { ILoginSecret } from '../util/useDeviceState'
import { PromptPasswordOption } from './components/PromptPasswordOption'
import { WebInputForAutofill } from '../background/WebInputForAutofill'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let promptOption: HTMLDivElement | null

export type PromptPasswordOptionProps = {
  loginCredentials: ILoginSecret[]
  webInputs: Array<
    Omit<WebInputForAutofill, '__typename' | 'id'>
  >
}

export function renderLoginCredOption(props: PromptPasswordOptionProps) {
  promptOption = document.createElement('div')
  render(
    <PromptPasswordOption
      loginCredentials={props.loginCredentials}
      webInputs={props.webInputs}
    />,
    promptOption
  )

  document.body.appendChild(promptOption)
}
