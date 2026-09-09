/** @jsxImportSource preact */
import { h, render } from 'preact'
import { autofill, resetAutofillStateForThisPage } from './autofill'
import { ILoginSecret } from '../util/useDeviceState'
import { PromptPasswordOption } from './components/PromptPasswordOption'
import { WebInputForAutofill } from '../background/WebInputForAutofill'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let promptOption: HTMLDivElement | null = null

export type PromptPasswordOptionProps = {
  loginCredentials: ILoginSecret[]
  webInputs: Array<Omit<WebInputForAutofill, '__typename' | 'id'>>
}

export function removeLoginCredOption() {
  if (!promptOption) {
    return
  }

  render(null, promptOption)
  promptOption.remove()
  promptOption = null
}

export function renderLoginCredOption(props: PromptPasswordOptionProps) {
  removeLoginCredOption()
  promptOption = document.createElement('div')
  render(
    <PromptPasswordOption
      loginCredentials={props.loginCredentials}
      webInputs={props.webInputs}
      container={promptOption}
      onSelectLogin={(loginCredential) => {
        resetAutofillStateForThisPage()
        autofill({
          secretsForHost: {
            loginCredentials: [loginCredential],
            totpSecrets: []
          },
          autofillEnabled: true,
          extensionDeviceReady: true,
          passwordCount: 0,
          saveLoginModalsState: undefined,
          webInputs: props.webInputs
        })
      }}
    />,
    promptOption
  )

  document.body.appendChild(promptOption)
}
