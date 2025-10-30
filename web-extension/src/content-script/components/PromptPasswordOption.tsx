import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
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
  resetAutofillStateForThisPage
} from '../autofill'

const log = debug('au:PromptPasswordOption')
const REFRESH_INTERVAL_MS = 100

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

  useEffect(() => {
    if (!inputEl) {
      return
    }

    let frameId: number | null = null
    let timeoutId: number | null = null
    let disposed = false
    let lastUpdate = 0

    const removePrompt = () => {
      if (promptOption && promptOption.parentNode) {
        promptOption.remove()
      }
    }

    const updatePosition = () => {
      if (disposed) {
        return
      }

      if (!inputEl || !inputEl.isConnected) {
        removePrompt()
        return
      }

      const bounds = inputEl.getBoundingClientRect()

      if (bounds.width === 0 || bounds.height === 0) {
        removePrompt()
        return
      }

      setPos(bounds)
      if (promptOption && !promptOption.parentNode) {
        document.body.appendChild(promptOption)
      }
    }

    const queuePositionUpdate = () => {
      if (frameId !== null || timeoutId !== null) {
        return
      }

      const elapsed = Date.now() - lastUpdate
      const delay = Math.max(0, REFRESH_INTERVAL_MS - elapsed)

      if (delay === 0) {
        frameId = requestAnimationFrame(() => {
          frameId = null
          lastUpdate = Date.now()
          updatePosition()
        })
      } else {
        timeoutId = window.setTimeout(() => {
          timeoutId = null
          frameId = requestAnimationFrame(() => {
            frameId = null
            lastUpdate = Date.now()
            updatePosition()
          })
        }, delay)
      }
    }

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(queuePositionUpdate)
        : null
    resizeObserver?.observe(inputEl)

    const mutationObserver =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(queuePositionUpdate)
        : null
    mutationObserver?.observe(document.body, {
      childList: true,
      subtree: true
    })

    window.addEventListener('scroll', queuePositionUpdate, true)
    window.addEventListener('resize', queuePositionUpdate)

    queuePositionUpdate()

    return () => {
      disposed = true
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      window.removeEventListener('scroll', queuePositionUpdate, true)
      window.removeEventListener('resize', queuePositionUpdate)
    }
  }, [inputEl, setPos])
  if (!pos) {
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
