/** @jsxImportSource preact */
import { render } from 'preact'
import { autofill, resetAutofillStateForThisPage } from './autofill'
import { ILoginSecret } from '../util/useDeviceState'
import { PromptPasswordOption } from './components/PromptPasswordOption'
import { WebInputForAutofill } from '../background/WebInputForAutofill'
import { contentVaultSignal } from './contentVaultSession'

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
  const signal = contentVaultSignal()
  removeLoginCredOption()
  promptOption = document.createElement('div')
  render(
    <PromptPasswordOption
      loginCredentials={props.loginCredentials}
      webInputs={props.webInputs}
      container={promptOption}
      onSelectLogin={(loginCredential) => {
        if (signal.aborted) return
        resetAutofillStateForThisPage()
        autofill(
          {
            secretsForHost: {
              loginCredentials: [loginCredential],
              totpSecrets: []
            },
            autofillEnabled: true,
            extensionDeviceReady: true,
            passwordCount: 0,
            saveLoginModalsState: undefined,
            webInputs: props.webInputs
          },
          { userInitiated: true }
        )
      }}
    />,
    promptOption
  )

  document.body.appendChild(promptOption)
}
