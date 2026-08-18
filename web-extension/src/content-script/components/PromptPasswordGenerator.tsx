import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import browser from 'webextension-polyfill'

import {
  fillGeneratedPasswordIntoInput,
  generatePasswordBasedOnUserConfig,
  handleGeneratedPasswordAutofill,
  resolveLiveGeneratedPasswordInput
} from '../autofill'
import { removePasswordGenerator } from '../renderPasswordGenerator'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

const TRIGGER_SIZE = 36
const FIELD_INSET = 6
const VIEWPORT_INSET = 8
const POPOVER_HEIGHT = 174

type GeneratorPosition = {
  left: number
  openAbove: boolean
  top: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const getGeneratorPosition = (input: HTMLInputElement): GeneratorPosition => {
  const rect = input.getBoundingClientRect()
  const maxLeft = Math.max(
    VIEWPORT_INSET,
    window.innerWidth - TRIGGER_SIZE - VIEWPORT_INSET
  )
  const maxTop = Math.max(
    VIEWPORT_INSET,
    window.innerHeight - TRIGGER_SIZE - VIEWPORT_INSET
  )

  return {
    left: clamp(
      rect.right - TRIGGER_SIZE - FIELD_INSET,
      VIEWPORT_INSET,
      maxLeft
    ),
    openAbove:
      rect.bottom + POPOVER_HEIGHT > window.innerHeight &&
      rect.top > POPOVER_HEIGHT,
    top: clamp(
      rect.top + (rect.height - TRIGGER_SIZE) / 2,
      VIEWPORT_INSET,
      maxTop
    )
  }
}

const didPositionChange = (
  current: GeneratorPosition,
  next: GeneratorPosition
) =>
  current.left !== next.left ||
  current.openAbove !== next.openAbove ||
  current.top !== next.top

export const PromptPasswordGenerator = ({
  input
}: {
  input: HTMLInputElement
}) => {
  const [position, setPosition] = useState(getGeneratorPosition(input))
  const [showDropdown, setShowDropdown] = useState(false)
  const [password, setPassword] = useState(generatePasswordBasedOnUserConfig())
  const [fillError, setFillError] = useState<string | null>(null)
  const [isFilling, setIsFilling] = useState(false)

  useEffect(() => {
    let frameId: number | null = null

    const updatePosition = () => {
      frameId = null
      const currentInput = resolveLiveGeneratedPasswordInput(input)
      if (!currentInput) {
        return
      }

      const nextPosition = getGeneratorPosition(currentInput)
      setPosition((currentPosition) => {
        if (didPositionChange(currentPosition, nextPosition)) {
          return nextPosition
        }
        return currentPosition
      })
    }

    const queuePositionUpdate = () => {
      if (frameId !== null) {
        return
      }
      frameId = window.requestAnimationFrame(updatePosition)
    }

    const mutationObserver = new MutationObserver(queuePositionUpdate)
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
    window.addEventListener('resize', queuePositionUpdate)
    window.addEventListener('scroll', queuePositionUpdate, true)
    queuePositionUpdate()

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
      mutationObserver.disconnect()
      window.removeEventListener('resize', queuePositionUpdate)
      window.removeEventListener('scroll', queuePositionUpdate, true)
    }
  }, [input])

  const generateNextPassword = () => {
    setPassword(generatePasswordBasedOnUserConfig())
    setFillError(null)
  }

  const fillPassword = async () => {
    setIsFilling(true)
    setFillError(null)

    const filledInput = await fillGeneratedPasswordIntoInput(input, password)
    if (!filledInput) {
      setIsFilling(false)
      setFillError('Could not fill this password field. Please try again.')
      setShowDropdown(true)
      return
    }

    await handleGeneratedPasswordAutofill(password, {
      passwordInput: filledInput,
      showSavePrompt: true
    })
    removePasswordGenerator()
  }

  const popoverPositionClass = position.openAbove
    ? 'authier-generator__popover--above'
    : 'authier-generator__popover--below'

  return (
    <div
      className="authier-generator authier-surface"
      onMouseEnter={() => setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`
      }}
    >
      <button
        aria-expanded={showDropdown}
        aria-label="Open Authier password generator"
        className="authier-generator__trigger"
        onClick={() => setShowDropdown(true)}
        title="Generate a secure password"
        type="button"
      >
        <img
          alt=""
          className="authier-generator__logo"
          src={browser.runtime.getURL('icon-128.png')}
        />
      </button>

      <div
        aria-label="Authier password generator"
        className={`authier-generator__popover ${popoverPositionClass}`}
        hidden={!showDropdown}
        role="dialog"
      >
        <p className="authier-generator__eyebrow">Suggested password</p>
        <code className="authier-generator__password">{password}</code>
        <div className="authier-generator__actions">
          <button
            className="authier-button authier-button--secondary"
            disabled={isFilling}
            onClick={generateNextPassword}
            type="button"
          >
            Next
          </button>
          <button
            className="authier-button authier-button--primary"
            disabled={isFilling}
            onClick={fillPassword}
            type="button"
          >
            {isFilling ? 'Filling…' : 'Fill'}
          </button>
        </div>
        {fillError ? (
          <p aria-live="polite" className="authier-generator__error">
            {fillError}
          </p>
        ) : null}
      </div>
    </div>
  )
}
