import { h } from 'preact'
import { useState } from 'preact/hooks'
import {
  promptOption,
  PromptPasswordOptionProps
} from '../renderLoginCredOption'
import browser from 'webextension-polyfill'
import { formatDistanceToNow } from 'date-fns'

//import { css } from '@emotion/css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h
import './Option.css'
import debug from 'debug'
import {
  autofill,
  filledElements,
  resetAutofillStateForThisPage
} from '../autofill'

const log = debug('au:PromptPasswordOption')
export const PromptPasswordOption = (props: PromptPasswordOptionProps) => {
  const { loginCredentials, webInputs } = props
  console.log('PromptPasswordOption2', { loginCredentials, webInputs })
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

  const darkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
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

      <div
        className="authier-dropdown-content"
        style={{
          backgroundColor: darkTheme ? '#1A202C' : '#dbedee'
        }}
      >
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
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {loginCredential.loginCredentials.username}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: darkTheme ? '#dbedee' : '#252323',
                    fontStyle: 'italic'
                  }}
                >
                  {loginCredential.loginCredentials.label}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: darkTheme ? '#d6fdff' : '#888'
                  }}
                >
                  {loginCredential.lastUsedAt
                    ? `Last used: ${formatDistanceToNow(new Date(loginCredential.lastUsedAt), { addSuffix: true })}`
                    : `Created: ${formatDistanceToNow(new Date(loginCredential.createdAt), { addSuffix: true })}`}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
