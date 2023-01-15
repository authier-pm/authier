// @ts-nocheck
import { ILoginSecret } from '../util/useDeviceState'

import { h, render } from 'preact'
import { PromptPasswordOption } from './components/PromptPasswordOption'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { Coords } from './contentScript'

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
    domCoordinates: Coords
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
