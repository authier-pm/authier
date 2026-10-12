/** @jsxImportSource preact */
import { findCredentialPickerInput } from '../findCredentialPickerInput'
import { useEffect, useState } from 'preact/hooks'
import type { PromptPasswordOptionProps } from '../renderLoginCredOption'
import browser from 'webextension-polyfill'
import { formatDistanceToNow } from 'date-fns'

//import { css } from '@emotion/css'
import './Option.css'
import debug from 'debug'
import type { ILoginSecret } from '../../util/useDeviceState'

const log = debug('au:PromptPasswordOption')
const REFRESH_INTERVAL_MS = 100
const TRIGGER_SIZE = 25
const VIEWPORT_MARGIN = 8

function didRectChange(prev: DOMRect, next: DOMRect) {
  return (
    prev.x !== next.x ||
    prev.y !== next.y ||
    prev.width !== next.width ||
    prev.height !== next.height ||
    prev.top !== next.top ||
    prev.right !== next.right ||
    prev.bottom !== next.bottom ||
    prev.left !== next.left
  )
}

export const PromptPasswordOption = (
  props: PromptPasswordOptionProps & {
    container: HTMLDivElement
    onSelectLogin: (login: ILoginSecret) => void
  }
) => {
  const { loginCredentials, webInputs, container } = props

  if (webInputs.length === 0) {
    log('No web inputs in PromptPasswordOption')
    return null
  }

  const inputEl = findCredentialPickerInput(webInputs)

  if (!inputEl) {
    log('No el in PromptPasswordOption')
    return null
  }
  const [pos, setPos] = useState(inputEl.getBoundingClientRect())
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }))
  log('GOT in option prompt', {
    inputEl,
    loginCredentials,
    pos: JSON.stringify(pos)
  })

  useEffect(() => {
    if (!inputEl) {
      return
    }

    const mountedPromptOption = container
    let trackedInputEl: HTMLInputElement | null = inputEl
    let frameId: number | null = null
    let timeoutId: number | null = null
    let disposed = false
    let lastUpdate = 0

    const removePrompt = () => {
      if (mountedPromptOption && mountedPromptOption.parentNode) {
        mountedPromptOption.remove()
      }
    }

    let resizeObserver: ResizeObserver | null = null

    const observeTrackedInput = (nextInputEl: HTMLInputElement | null) => {
      if (trackedInputEl === nextInputEl) {
        return
      }
      resizeObserver?.disconnect()
      trackedInputEl = nextInputEl
      if (trackedInputEl) {
        resizeObserver?.observe(trackedInputEl)
      }
    }

    const updatePosition = () => {
      if (disposed) {
        return
      }

      observeTrackedInput(findCredentialPickerInput(webInputs))

      if (!trackedInputEl) {
        removePrompt()
        return
      }

      const bounds = trackedInputEl.getBoundingClientRect()

      if (bounds.width === 0 || bounds.height === 0) {
        observeTrackedInput(findCredentialPickerInput(webInputs))
        if (!trackedInputEl) {
          removePrompt()
          return
        }
      }

      const nextBounds = trackedInputEl.getBoundingClientRect()
      setPos((prev) => (didRectChange(prev, nextBounds) ? nextBounds : prev))
      setViewport((prev) => {
        if (
          prev.width === window.innerWidth &&
          prev.height === window.innerHeight
        ) {
          return prev
        }
        return { width: window.innerWidth, height: window.innerHeight }
      })
      if (mountedPromptOption && !mountedPromptOption.parentNode) {
        document.body.appendChild(mountedPromptOption)
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

    resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(queuePositionUpdate)
        : null
    resizeObserver?.observe(trackedInputEl)

    const mutationObserver =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver((records) => {
            if (
              mountedPromptOption &&
              records.every((record) =>
                mountedPromptOption.contains(record.target)
              )
            ) {
              return
            }
            queuePositionUpdate()
          })
        : null
    mutationObserver?.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'type',
        'id',
        'name',
        'class',
        'maxlength',
        'autocomplete',
        'inputmode',
        'aria-label',
        'disabled',
        'readonly',
        'style',
        'hidden'
      ]
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
  }, [container, inputEl, setPos, webInputs])
  if (!pos) {
    return null
  }

  const darkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
  const triggerLeft = Math.min(
    pos.right + 2,
    viewport.width - TRIGGER_SIZE - VIEWPORT_MARGIN
  )
  const triggerTop = Math.max(
    VIEWPORT_MARGIN,
    pos.top + (pos.height - TRIGGER_SIZE) / 2
  )
  const spaceBelow =
    viewport.height - triggerTop - TRIGGER_SIZE - VIEWPORT_MARGIN
  const spaceAbove = triggerTop - VIEWPORT_MARGIN
  const openAbove = spaceBelow < 240 && spaceAbove > spaceBelow
  const menuWidth = Math.min(300, viewport.width - VIEWPORT_MARGIN * 2)
  return (
    <div
      className="authier-dropdown"
      style={{
        zIndex: '2147483647', // max z-index according to stackoverflow
        justifyContent: 'center',
        alignItems: 'baseline',
        fontFamily: 'sans-serif',
        position: 'fixed',
        top: triggerTop + 'px',
        left: triggerLeft + 'px',
        width: TRIGGER_SIZE + 'px',
        height: TRIGGER_SIZE + 'px'
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
          backgroundColor: darkTheme ? '#1A202C' : '#dbedee',
          top: openAbove ? 'auto' : TRIGGER_SIZE + 'px',
          bottom: openAbove ? TRIGGER_SIZE + 'px' : 'auto',
          left:
            Math.min(
              0,
              viewport.width - VIEWPORT_MARGIN - triggerLeft - menuWidth
            ) + 'px',
          width: menuWidth + 'px',
          maxHeight: Math.min(480, openAbove ? spaceAbove : spaceBelow) + 'px'
        }}
      >
        {loginCredentials.map((loginCredential) => {
          return (
            <a
              key={loginCredential.id}
              onClick={() => props.onSelectLogin(loginCredential)}
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
