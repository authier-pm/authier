import { useState } from 'react'
import {
  IoCheckmarkOutline,
  IoCloseOutline,
  IoCopyOutline
} from 'react-icons/io5'
import { copyTextToClipboard } from '@src/lib/clipboard'
import {
  EmailCodeMessageKind,
  maskEmailCode,
  type EmailVerificationCode
} from './emailCodeProtocol'
import { useEmailVerificationCodes } from './useEmailVerificationCodes'
import { EmailCodeSourceButton } from './EmailCodeSourceButton'

const EmailVerificationCodeItem = ({
  entry,
  update
}: {
  entry: EmailVerificationCode
  update: ReturnType<typeof useEmailVerificationCodes>['update']
}) => {
  const [revealed, setRevealed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const copy = async () => {
    if (entry.expiresAt <= Date.now()) {
      setError('This code has expired.')
      return
    }
    setBusy(true)
    setError('')
    // Clipboard failures are expected (e.g. browser permission denied).
    const copied = await copyTextToClipboard(entry.code).then(
      () => true,
      () => false
    )
    if (copied) {
      setRevealed(true)
      await update(EmailCodeMessageKind.COPIED, entry.id).catch(() => {
        setError('Code copied. Could not clear the notification.')
      })
    } else {
      setError('Could not copy the code. Please try again.')
    }
    setBusy(false)
  }

  return (
    <li className="extension-surface rounded-[var(--radius-md)] border border-[color:var(--color-border)] p-3">
      <div className="flex items-start gap-2">
        <EmailCodeSourceButton entry={entry} />
        <button
          type="button"
          className="group flex min-w-0 flex-1 gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] disabled:opacity-60"
          aria-label={`Copy ${entry.provider} verification code from ${entry.sender}`}
          disabled={busy}
          onClick={copy}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-[color:var(--color-muted)]">
              {entry.provider} verification code
            </span>
            <span className="mt-0.5 block break-all text-xs">
              from {entry.sender}
            </span>
            <span className="mt-2 flex items-center gap-2 font-mono text-xl font-semibold tracking-widest text-[color:var(--color-primary)]">
              <span>{revealed ? entry.code : maskEmailCode(entry.code)}</span>
              {revealed ? (
                <IoCheckmarkOutline className="size-4" aria-hidden />
              ) : (
                <IoCopyOutline
                  className="size-4 opacity-70 group-hover:opacity-100"
                  aria-hidden
                />
              )}
            </span>
            <span
              className="mt-1 block text-[11px] text-[color:var(--color-muted)]"
              role="status"
            >
              {revealed ? 'Copied to clipboard' : 'Click to copy & reveal'}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="rounded-md p-1 text-[color:var(--color-muted)] hover:bg-[color:var(--color-accent)] focus-visible:outline-[color:var(--color-ring)]"
          aria-label={`Dismiss verification code from ${entry.sender}`}
          onClick={() => {
            void update(EmailCodeMessageKind.DISMISS, entry.id).catch(() =>
              setError('Could not dismiss the code. Please try again.')
            )
          }}
        >
          <IoCloseOutline className="size-4" />
        </button>
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-2 text-xs text-[color:var(--color-danger)]"
        >
          {error}
        </p>
      ) : null}
    </li>
  )
}

export const EmailVerificationCodes = () => {
  const { entries, error, update } = useEmailVerificationCodes()
  if (!entries.length && !error) return null

  return (
    <section aria-label="Email verification codes" className="px-3 pt-3 pb-1">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="text-xs font-semibold text-[color:var(--color-muted)]">
          FROM YOUR EMAIL
        </h2>
        <span className="text-[10px] text-[color:var(--color-muted)]">
          Temporary codes
        </span>
      </div>
      {error ? (
        <p
          role="alert"
          className="mb-2 text-xs text-[color:var(--color-danger)]"
        >
          Could not load email codes. Reopen Authier to try again.
        </p>
      ) : null}
      <ul className="grid gap-2">
        {entries.map((entry) => (
          <EmailVerificationCodeItem
            key={entry.id}
            entry={entry}
            update={update}
          />
        ))}
      </ul>
    </section>
  )
}
