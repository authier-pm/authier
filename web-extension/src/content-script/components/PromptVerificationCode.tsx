/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks'
import browser from 'webextension-polyfill'
import {
  CodeMessageKind,
  pageVerificationCodeSchema,
  verificationCodeSuggestionsSchema,
  type VerificationCodeSuggestion
} from '../../verification-codes/verificationCodeProtocol'
import { fillOtpInputs } from '../fillOtpInputs'
import { isElementVisibleInViewport } from '../isElementInViewport'
import {
  suggestionFitsTarget,
  type VerificationCodePosition,
  type VerificationCodeTarget
} from '../verificationCodeTarget'

const CodeChoice = ({
  entry,
  busy,
  onSelect
}: {
  entry: VerificationCodeSuggestion
  busy: boolean
  onSelect: (entry: VerificationCodeSuggestion, event: MouseEvent) => void
}) => (
  <button
    type="button"
    className="authier-code__choice"
    disabled={busy}
    aria-label={`Fill verification code from ${entry.sender}`}
    onClick={(event) => onSelect(entry, event)}
  >
    <span className="authier-code__source">
      {entry.provider === 'Gmail' ? 'From your email' : 'From your phone'}
    </span>
    <span className="authier-code__sender">{entry.sender}</span>
    <span className="authier-code__value">
      <code>{entry.maskedCode}</code>
      <span>
        {busy ? 'Filling…' : `Fill ${entry.codeLength} digits`}{' '}
        <span aria-hidden>↗</span>
      </span>
    </span>
  </button>
)

export const PromptVerificationCode = ({
  target,
  position,
  dispatchedEvents
}: {
  target: VerificationCodeTarget
  position: VerificationCodePosition
  dispatchedEvents: Set<Event>
}) => {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<VerificationCodeSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const surface = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const mountedSurface = surface.current
    let active = true
    let fetching = false
    setLoading(true)
    const refresh = async () => {
      if (fetching) return
      fetching = true
      const response: unknown = await browser.runtime
        .sendMessage({
          kind: CodeMessageKind.LIST_FOR_PAGE
        })
        .then(
          (value: unknown) => value,
          () => null
        )
      fetching = false
      if (!active) return
      const parsed = verificationCodeSuggestionsSchema.safeParse(response)
      setLoading(false)
      setError(parsed.success ? '' : 'Could not load codes. Please try again.')
      setEntries(parsed.success ? parsed.data : [])
    }
    const dismiss = (event: Event) => {
      // Outside the closed shadow root the event path exposes only its host.
      const root = surface.current?.getRootNode()
      const boundary = root instanceof ShadowRoot ? root.host : surface.current
      if (!boundary || !event.composedPath().includes(boundary)) setOpen(false)
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
    const timer = window.setInterval(() => void refresh(), 4000)
    const expiryTimer = window.setInterval(() => {
      setEntries((current) =>
        current.filter((entry) => entry.expiresAt > Date.now())
      )
    }, 1000)
    void refresh()
    document.addEventListener('pointerdown', dismiss, true)
    document.addEventListener('focusin', dismiss)
    mountedSurface?.addEventListener('keydown', keydown)
    panel.current?.focus()
    return () => {
      active = false
      window.clearInterval(timer)
      window.clearInterval(expiryTimer)
      document.removeEventListener('pointerdown', dismiss, true)
      document.removeEventListener('focusin', dismiss)
      mountedSurface?.removeEventListener('keydown', keydown)
    }
  }, [open])

  const select = async (
    entry: VerificationCodeSuggestion,
    event: MouseEvent
  ) => {
    // Page scripts must not be able to programmatically click a code choice.
    if (!event.isTrusted || busy) return
    setBusy(true)
    setError('')
    const pageUrl = location.href
    const response: unknown = await browser.runtime
      .sendMessage({
        kind: CodeMessageKind.GET_FOR_PAGE,
        id: entry.id
      })
      .then(
        (value: unknown) => value,
        () => null
      )
    const parsed = pageVerificationCodeSchema.safeParse(response)
    if (
      !parsed.success ||
      parsed.data.expiresAt <= Date.now() ||
      location.href !== pageUrl ||
      !target.inputs.every(isElementVisibleInViewport)
    ) {
      setBusy(false)
      setError('This code or field is no longer available. Please try again.')
      return
    }
    const filled = await fillOtpInputs(
      target.inputs,
      parsed.data.code,
      dispatchedEvents
    )
    setBusy(false)
    if (!filled) {
      setError('Could not fill every digit. Please try again.')
      setOpen(true)
      return
    }
    setOpen(false)
    await browser.runtime.sendMessage({
      kind: CodeMessageKind.FILLED_FOR_PAGE,
      id: entry.id
    })
  }

  const choices = entries.filter((entry) => suggestionFitsTarget(entry, target))
  const hint = target.segmented
    ? `Choose a code to fill all ${target.inputs.length} digits.`
    : 'Choose a code to fill this field.'

  return (
    <div ref={surface} className="authier-surface authier-code">
      <button
        ref={trigger}
        type="button"
        className="authier-code__trigger"
        style={{ left: position.left, top: position.top }}
        aria-label="Open Authier verification codes"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="authier-verification-code-choices"
        title="Fill a verification code with Authier"
        onClick={(event) => {
          if (event.isTrusted) setOpen((current) => !current)
        }}
      >
        <img src={browser.runtime.getURL('icon-128.png')} alt="" />
      </button>
      {open ? (
        <div
          ref={panel}
          id="authier-verification-code-choices"
          className="authier-code__panel"
          style={{ left: position.panelLeft, top: position.panelTop }}
          role="dialog"
          aria-label="Authier verification codes"
          tabIndex={-1}
        >
          <div className="authier-code__heading">
            <strong>Verification codes</strong>
            <button
              type="button"
              className="authier-icon-button"
              aria-label="Close verification codes"
              onClick={() => {
                setOpen(false)
                trigger.current?.focus()
              }}
            >
              ×
            </button>
          </div>
          <p className="authier-code__hint">{hint}</p>
          <div className="authier-code__choices" aria-busy={loading || busy}>
            {choices.map((entry) => (
              <CodeChoice
                key={entry.id}
                entry={entry}
                busy={busy}
                onSelect={select}
              />
            ))}
          </div>
          {loading ? (
            <p className="authier-code__hint" role="status">
              Checking for codes…
            </p>
          ) : null}
          {!loading && !choices.length && !error ? (
            <p className="authier-code__empty" role="status">
              No matching code yet. Open the email or message containing your
              code, then check here again.
            </p>
          ) : null}
          {error ? (
            <p className="authier-code__error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
