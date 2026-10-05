import { useState } from 'react'
import {
  IoCheckmarkOutline,
  IoCloseOutline,
  IoCopyOutline
} from 'react-icons/io5'
import { copyTextToClipboard } from '@src/lib/clipboard'
import {
  CodeMessageKind,
  isSmsCode,
  maskCode,
  type VerificationCode
} from './verificationCodeProtocol'
import { useVerificationCodes } from './useVerificationCodes'
import { CodeSourceButton } from './CodeSourceButton'

type UpdateCode = ReturnType<typeof useVerificationCodes>['update']

const codeSections = [
  {
    label: 'Email verification codes',
    heading: 'FROM YOUR EMAIL',
    includes: (entry: VerificationCode) => !isSmsCode(entry)
  },
  {
    label: 'SMS verification codes',
    heading: 'FROM YOUR PHONE',
    includes: isSmsCode
  }
]

const getCodeLabels = (entry: VerificationCode) => {
  if (entry.provider === 'Gmail')
    return { kind: 'Gmail', title: 'Gmail verification code' }
  const via = entry.provider === 'Android' ? entry.deviceName : entry.provider
  return { kind: 'SMS', title: `SMS code · ${via}` }
}

const VerificationCodeItem = ({
  entry,
  update
}: {
  entry: VerificationCode
  update: UpdateCode
}) => {
  const [revealed, setRevealed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const labels = getCodeLabels(entry)

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
      await update(CodeMessageKind.COPIED, entry.id).catch(() => {
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
        <CodeSourceButton entry={entry} />
        <button
          type="button"
          className="group flex min-w-0 flex-1 gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] disabled:opacity-60"
          aria-label={`Copy ${labels.kind} verification code from ${entry.sender}`}
          disabled={busy}
          onClick={copy}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-[color:var(--color-muted)]">
              {labels.title}
            </span>
            <span className="mt-0.5 block break-all text-xs">
              from {entry.sender}
            </span>
            <span className="mt-2 flex items-center gap-2 font-mono text-xl font-semibold tracking-widest text-[color:var(--color-primary)]">
              <span>{revealed ? entry.code : maskCode(entry.code)}</span>
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
            void update(CodeMessageKind.DISMISS, entry.id).catch(() =>
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

const CodeSection = ({
  section,
  entries,
  update,
  dismissAll
}: {
  section: (typeof codeSections)[number]
  entries: VerificationCode[]
  update: UpdateCode
  dismissAll: ReturnType<typeof useVerificationCodes>['dismissAll']
}) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!entries.length) return null

  const dismiss = () => {
    setBusy(true)
    setError('')
    void dismissAll(entries)
      .catch(() => {
        setError('Could not dismiss the codes. Please try again.')
      })
      .finally(() => setBusy(false))
  }

  return (
    <section aria-label={section.label} className="px-3 pt-3 pb-1">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="text-xs font-semibold text-[color:var(--color-muted)]">
          {section.heading}
        </h2>
        <button
          type="button"
          className="shrink-0 rounded-sm text-[10px] text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)] hover:underline focus-visible:outline-[color:var(--color-ring)] disabled:opacity-60"
          disabled={busy}
          onClick={dismiss}
        >
          Dismiss all {entries.length} temp codes
        </button>
      </div>
      {error ? (
        <p
          role="alert"
          className="mb-2 text-xs text-[color:var(--color-danger)]"
        >
          {error}
        </p>
      ) : null}
      <ul className="grid gap-2">
        {entries.map((entry) => (
          <VerificationCodeItem key={entry.id} entry={entry} update={update} />
        ))}
      </ul>
    </section>
  )
}

export const VerificationCodes = () => {
  const { entries, error, update, dismissAll } = useVerificationCodes()
  if (!entries.length && !error) return null

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="px-4 pt-3 text-xs text-[color:var(--color-danger)]"
        >
          Could not load verification codes. Reopen Authier to try again.
        </p>
      ) : null}
      {codeSections.map((section) => (
        <CodeSection
          key={section.label}
          section={section}
          entries={entries.filter(section.includes)}
          update={update}
          dismissAll={dismissAll}
        />
      ))}
    </>
  )
}
