import { useState } from 'react'
import browser from 'webextension-polyfill'
import { IoMailOutline } from 'react-icons/io5'
import { SecretItemIcon } from '@src/components/SecretItemIcon'
import {
  EmailCodeMessageKind,
  type EmailVerificationCode
} from './emailCodeProtocol'

export const EmailCodeSourceButton = ({
  entry
}: {
  entry: EmailVerificationCode
}) => {
  const [opening, setOpening] = useState(false)
  const [failed, setFailed] = useState(false)
  const domain = entry.sender
    .slice(entry.sender.lastIndexOf('@') + 1)
    .toLowerCase()
  const label = `Open ${entry.provider} for email from ${entry.sender}`

  const openSource = async () => {
    setOpening(true)
    setFailed(false)
    const opened: unknown = await browser.runtime
      .sendMessage({
        kind: EmailCodeMessageKind.OPEN_SOURCE,
        id: entry.id
      })
      .catch(() => false)
    setFailed(opened !== true)
    setOpening(false)
  }

  return (
    <span className="relative mt-0.5 shrink-0">
      <button
        type="button"
        aria-label={label}
        title={failed ? 'Could not open Gmail. Click to try again.' : label}
        disabled={opening}
        onClick={openSource}
        className="relative flex size-9 items-center justify-center rounded-lg bg-[color:var(--color-accent)] text-[color:var(--color-primary)] hover:bg-[color:var(--color-secondary)] focus-visible:outline-2 focus-visible:outline-[color:var(--color-ring)] disabled:opacity-60"
      >
        <SecretItemIcon
          key={domain}
          iconUrl={null}
          url={`https://${domain}`}
          alt={`${domain} favicon`}
          fallback={
            <IoMailOutline className="size-5" aria-label="Email icon" />
          }
        />
        {!entry.copied ? (
          <span
            className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-white ring-2 ring-[color:var(--color-card)]"
            aria-hidden
          >
            <IoMailOutline className="size-2.5" />
          </span>
        ) : null}
      </button>
      {failed ? (
        <span className="sr-only" role="alert">
          Could not open Gmail. Please try again.
        </span>
      ) : null}
    </span>
  )
}
