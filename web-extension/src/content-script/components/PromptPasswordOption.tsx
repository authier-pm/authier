import { h } from 'preact'
import { useState } from 'preact/hooks'
import {
  promptOption,
  PromptPasswordOptionProps
} from '../renderLoginCredOption'
import browser from 'webextension-polyfill'

//import { css } from '@emotion/css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h
import './Option.css'
import debug from 'debug'
const log = debug('au:PromptPasswordOption')
import {
  autofill,
  filledElements,
  resetAutofillStateForThisPage
} from '../autofill'

export const PromptPasswordOption = (props: PromptPasswordOptionProps) => {
  const { loginCredentials, webInputs } = props
  if (webInputs.length === 0) {
    log('No web inputs in PromptPasswordOption')
    return null
  }

  let inputEl: HTMLInputElement | null = null

  for (const webInput of webInputs) {
    inputEl = document.querySelector(webInput.domPath)
    if (inputEl) {
      const bounds = inputEl.getBoundingClientRect()
      if (bounds.width > 0 && bounds.height > 0) {
        break // found a visible input element
      }
    }
  }

  if (!inputEl) {
    log('No el in PromptPasswordOption')
    return null
  }
  const [pos, setPos] = useState(inputEl.getBoundingClientRect())
  log('GOT in option prompt', {
    inputEl,
    loginCredentials,
    pos: JSON.stringify(pos)
  })

  let resizeTimer: string | number | NodeJS.Timeout | undefined
  window.onresize = function () {
    if (promptOption) {
      promptOption.remove()
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(function () {
        if (promptOption && inputEl) {
          setPos(inputEl.getBoundingClientRect())
          document.body.appendChild(promptOption)
        }
      }, 100)
    }
  }
  if (!pos) {
    log('No pos in PromptPasswordOption')
    return null
  }

  return (
    <div
      className="authier-dropdown"
      style={{
        zIndex: '2147483647', // max z-index according to stackoverflow
        justifyContent: 'center',
        alignItems: 'baseline',
        fontFamily: 'sans-serif !important',
        position: 'fixed',
        top: pos.top + (pos.height / 2 - 12.5) + 'px',
        left: pos.left + pos.width + 2 + 'px', // 2px is extra padding
        right: pos.right + 'px',
        bottom: pos.bottom + 'px'
      }}
    >
      <span
        className="authier-logo-icon"
        style={{
          backgroundImage: `url('${browser.runtime.getURL('icon-128.png')}')`,
          backgroundSize: 'contain',
          borderRadius: '20%'
        }}
      ></span>

      <div className="authier-dropdown-content">
        {loginCredentials.map((loginCredential) => {
          return (
            <a
              key={loginCredential.id}
              onClick={async () => {
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
                  webInputs: webInputs
                })
              }}
            >
              {loginCredential.loginCredentials.username}
            </a>
          )
        })}
      </div>
    </div>
  )
}
