// @ts-nocheck

import { PromptPassword } from './components/PromptPassword'
import { BackgroundMessageType } from '../background/BackgroundMessageType'
import browser from 'webextension-polyfill'
import { domRecorder } from './contentScript'
import { ILoginSecret } from '../util/useDeviceState'

import { h, render } from 'preact'
import { PromptPasswordOption } from './components/PromptPasswordOption'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let promptOption: HTMLDivElement | null

export function renderLoginCredOption(
  loginCredentials: ILoginSecret[],
  webInputs: Array<{
    __typename?: 'WebInputGQL'
    id: number
    url: string
    host: string
    domPath: string
    kind: WebInputType
    createdAt: string
  }>
) {
  promptOption = document.createElement('div')
  render(
    <PromptPasswordOption
      loginCredentials={loginCredentials}
      webInputs={webInputs}
    />,
    promptOption
  )

  document.body.appendChild(promptOption)
}
