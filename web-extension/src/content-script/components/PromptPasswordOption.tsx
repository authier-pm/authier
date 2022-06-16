// @ts-nocheck

import { h } from 'preact'
import { ILoginSecret } from '../../util/useDeviceState'
import { WebInputType } from '../../../../shared/generated/graphqlBaseTypes'
import { useState, useEffect } from 'preact/hooks'
import { promptOption } from '../renderLoginCredOption'
//import { css } from '@emotion/css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h
import './Option.css'
import { autofill } from '../autofill'

export const PromptPasswordOption = ({
  loginCredentials,
  webInputs
}: {
  loginCredentials: ILoginSecret[]
  webInputs: Array<{
    __typename?: 'WebInputGQL'
    id: number
    url: string
    host: string
    domPath: string
    kind: WebInputType
    createdAt: string
  }>
}) => {
  if (webInputs.length === 0) {
    return null
  }
  console.log('GOT in option prompt', { webInputs, loginCredentials })

  const el = document.querySelector(webInputs[0].domPath)
  const [pos, setPos] = useState(el?.getBoundingClientRect())

  let resizeTimer
  window.onresize = function () {
    if (promptOption) {
      promptOption.remove()
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(function () {
        setPos(el?.getBoundingClientRect())
        document.body.appendChild(promptOption)
      }, 100)
    }
  }
  if (!pos) {
    return null
  }

  return (
    <div
      className="dropdown"
      style={{
        zIndex: '2147483647', // max z-index according to stackoverflow
        justifyContent: 'center',
        alignItems: 'baseline',
        fontFamily: 'sans-serif !important',
        position: 'fixed',
        top: (pos.top as number) - 10 + 'px',
        left: pos.left + pos.width + 'px',
        right: pos.right + 'px',
        bottom: pos.bottom + 'px'
      }}
    >
      <span className="iconAuthier"></span>

      <div className="dropdown-content">
        {loginCredentials.map((el) => {
          return (
            <a
              onClick={async () => {
                autofill(
                  {
                    secretsForHost: { loginCredentials: [el], totpSecrets: [] },
                    autofillEnabled: true,
                    extensionDeviceReady: true,
                    saveLoginModalsState: undefined,
                    webInputs: webInputs
                  },
                  true
                )
              }}
            >
              {el.loginCredentials.username}
            </a>
          )
        })}
      </div>
    </div>
  )
}
