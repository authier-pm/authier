import { h, render } from 'preact'
import { ILoginSecret } from '../util/useDeviceState'
import { PromptPasswordOption } from './components/PromptPasswordOption'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let promptOption: HTMLDivElement | null

export type PromptPasswordOptionProps = {
  loginCredentials: ILoginSecret[]
  webInputs: Array<{
    __typename?: 'WebInputGQL'
    id?: number
    url: string
    host: string
    domPath: string
    kind: WebInputType
    createdAt: string
  }>
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
