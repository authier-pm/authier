import { PromptPassword } from './components/PromptPassword'
import { BackgroundMessageType } from '../background/BackgroundMessageType'
import browser from 'webextension-polyfill'
import { domRecorder } from './contentScript'
import { ILoginSecret } from '../util/useDeviceState'

import { h, render } from 'nano-jsx/lib/core'
import { PromptPasswordOption } from './components/PromptPasswordOption'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let promptDiv: HTMLDivElement | null

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
  console.log('TEST', loginCredentials)
  promptDiv = document.createElement('div')
  render(
    <PromptPasswordOption
      loginCredentials={loginCredentials}
      webInputs={webInputs}
    />,
    promptDiv
  )

  document.body.appendChild(promptDiv)
}
