import { useState } from 'react'
import browser from 'webextension-polyfill'
import {
  IoChatbubbleEllipsesOutline,
  IoMailOutline,
  IoPhonePortraitOutline
} from 'react-icons/io5'
import { SecretItemIcon } from '@src/components/SecretItemIcon'
import {
  CodeMessageKind,
  type VerificationCode
} from './verificationCodeProtocol'

const iconClassName =
  'relative flex size-9 items-center justify-center rounded-lg bg-[color:var(--color-accent)] text-[color:var(--color-primary)]'

const NewCodeBadge = ({ entry }: { entry: VerificationCode }) => {
  if (entry.copied) return null
  const Icon =
    entry.provider === 'Gmail' ? IoMailOutline : IoChatbubbleEllipsesOutline
  return (
    <span
      className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-white ring-2 ring-[color:var(--color-card)]"
      aria-hidden
    >
      <Icon className="size-2.5" />
    </span>
  )
}

const SenderIcon = ({ entry }: { entry: VerificationCode }) => {
  if (entry.provider !== 'Gmail')
    return (
      <IoChatbubbleEllipsesOutline className="size-5" aria-label="SMS icon" />
    )
  const domain = entry.sender
    .slice(entry.sender.lastIndexOf('@') + 1)
    .toLowerCase()
  return (
    <SecretItemIcon
      key={domain}
      iconUrl={null}
      url={`https://${domain}`}
      alt={`${domain} favicon`}
      fallback={<IoMailOutline className="size-5" aria-label="Email icon" />}
    />
  )
}

/** Opens the web app a code was read from; phone relays have nothing to open. */
export const CodeSourceButton = ({ entry }: { entry: VerificationCode }) => {
  const [opening, setOpening] = useState(false)
  const [failed, setFailed] = useState(false)

  if (entry.provider === 'Android') {
    return (
      <span
        role="img"
        aria-label={`Relayed from ${entry.deviceName}`}
        title={`Relayed from ${entry.deviceName}`}
        className={`${iconClassName} mt-0.5 shrink-0`}
      >
        <IoPhonePortraitOutline className="size-5" />
        <NewCodeBadge entry={entry} />
      </span>
    )
  }

  const message = entry.provider === 'Gmail' ? 'email' : 'SMS'
  const label = `Open ${entry.provider} for ${message} from ${entry.sender}`
  const openSource = async () => {
    setOpening(true)
    setFailed(false)
    const opened: unknown = await browser.runtime
      .sendMessage({ kind: CodeMessageKind.OPEN_SOURCE, id: entry.id })
      .catch(() => false)
    setFailed(opened !== true)
    setOpening(false)
  }

  return (
    <span className="relative mt-0.5 shrink-0">
      <button
        type="button"
        aria-label={label}
        title={
          failed
            ? `Could not open ${entry.provider}. Click to try again.`
            : label
        }
        disabled={opening}
        onClick={openSource}
        className={`${iconClassName} hover:bg-[color:var(--color-secondary)] focus-visible:outline-2 focus-visible:outline-[color:var(--color-ring)] disabled:opacity-60`}
      >
        <SenderIcon entry={entry} />
        <NewCodeBadge entry={entry} />
      </button>
      {failed ? (
        <span className="sr-only" role="alert">
          Could not open {entry.provider}. Please try again.
        </span>
      ) : null}
    </span>
  )
}
