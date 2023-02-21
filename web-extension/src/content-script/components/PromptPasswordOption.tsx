import { h } from 'preact'
import { useState } from 'preact/hooks'
import {
  promptOption,
  PromptPasswordOptionProps
} from '../renderLoginCredOption'

//import { css } from '@emotion/css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h
import './Option.css'
import debug from 'debug'
const log = debug('au:PromptPasswordOption')
import { autofill } from '../autofill'

export const PromptPasswordOption = (props: PromptPasswordOptionProps) => {
  const { loginCredentials, webInputs } = props
  log('GOT in option prompt', { webInputs, loginCredentials })
  if (webInputs.length === 0) {
    log('No web inputs in PromptPasswordOption')
    return null
  }

  let el = document.querySelector(webInputs[0].domPath)
  if (!el) {
    el = document.elementFromPoint(
      webInputs[0].domCoordinates.x,
      webInputs[0].domCoordinates.y
    )
    log('el', el)
  }
  const [pos, setPos] = useState(el?.getBoundingClientRect())

  let resizeTimer: string | number | NodeJS.Timeout | undefined
  window.onresize = function () {
    if (promptOption) {
      promptOption.remove()
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(function () {
        setPos(el?.getBoundingClientRect())
        document.body.appendChild(promptOption!)
      }, 100)
    }
  }
  if (!pos) {
    log('No pos in PromptPasswordOption')
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
              key={el.id}
              onClick={async () => {
                autofill(
                  {
                    secretsForHost: { loginCredentials: [el], totpSecrets: [] },
                    autofillEnabled: true,
                    extensionDeviceReady: true,
                    passwordCount: 0,
                    saveLoginModalsState: undefined,
                    webInputs: webInputs
                  },
                  false
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
