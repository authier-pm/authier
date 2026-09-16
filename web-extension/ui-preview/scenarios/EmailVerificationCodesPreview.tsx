import { useEffect, useState, useSyncExternalStore } from 'react'
import { IoMailOutline } from 'react-icons/io5'
import { EmailVerificationCodes } from '@src/email-codes/EmailVerificationCodes'
import { EmailCodeMessageKind } from '@src/email-codes/emailCodeProtocol'
import { observeGmailCodes } from '@src/email-codes/readGmailCodes'
import {
  handleEmailVerificationCodeMessage,
  initializeEmailVerificationCodes
} from '@src/background/emailVerificationCodes'
import { PopupPreview } from '../PopupPreview'
import browser, {
  getPreviewActiveTabId,
  getPreviewBadgeText,
  setPreviewMessageHandler,
  subscribePreviewBadge,
  subscribePreviewTab
} from '../browserMock'
import { gmailVerificationEmail } from '../fixtures/gmailVerificationEmail'

const PreviewToolbar = () => {
  const badge = useSyncExternalStore(subscribePreviewBadge, getPreviewBadgeText)
  return (
    <div className="mb-3 flex items-center justify-between text-xs text-[color:var(--color-muted)]">
      <span>Authier · extension popup</span>
      <div className="relative rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-2">
        <img
          src={new URL('../../../shared/imgs/logo.svg', import.meta.url).href}
          alt="Authier"
          className="size-6"
        />
        {badge ? (
          <span
            aria-label="New email verification code"
            className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[color:var(--color-background)] bg-red-500"
          />
        ) : null}
      </div>
    </div>
  )
}

export const EmailVerificationCodesPreview = () => {
  const [ready, setReady] = useState(false)
  const activeTabId = useSyncExternalStore(
    subscribePreviewTab,
    getPreviewActiveTabId
  )
  useEffect(() => {
    setPreviewMessageHandler((message) => {
      const isReport =
        typeof message === 'object' &&
        message !== null &&
        'kind' in message &&
        message.kind === EmailCodeMessageKind.REPORT
      return handleEmailVerificationCodeMessage(message, {
        id: browser.runtime.id,
        url: isReport
          ? 'https://mail.google.com/mail/u/0/#inbox'
          : browser.runtime.getURL('js/popup.html'),
        frameId: 0,
        ...(isReport
          ? {
              tab: {
                id: 42,
                windowId: 7,
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false
              }
            }
          : {})
      })
    })
    initializeEmailVerificationCodes()
    const stop = observeGmailCodes(document, (candidates) =>
      browser.runtime.sendMessage({
        kind: EmailCodeMessageKind.REPORT,
        candidates
      })
    )
    setReady(true)
    return () => {
      stop()
      setPreviewMessageHandler(undefined)
    }
  }, [])

  return (
    <div className="mx-auto min-h-screen max-w-[920px] p-8" data-ui-preview>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)]">
        Authier / Email verification
      </p>
      <h1 className="mt-2 mb-8 text-2xl font-semibold">
        Your email code, one click away.
      </h1>
      <div className="grid grid-cols-[minmax(0,1fr)_350px] items-start gap-8">
        <div>
          <div className="mb-3 flex h-[42px] items-center gap-2 text-xs text-[color:var(--color-muted)]">
            <IoMailOutline className="size-4" />
            {activeTabId === 42
              ? 'Gmail · active tab'
              : 'Gmail · open in another tab'}
          </div>
          <div
            data-gmail-fixture
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5 text-sm [&_.hP]:mb-4 [&_.hP]:text-lg [&_.hP]:font-semibold [&_.gE]:mb-6 [&_.gE]:text-xs [&_.gE]:text-[color:var(--color-muted)] [&_p]:mb-4 [&_strong]:font-mono [&_strong]:text-2xl [&_strong]:tracking-widest"
            dangerouslySetInnerHTML={{ __html: gmailVerificationEmail }}
          />
          <p className="mt-4 text-xs leading-relaxed text-[color:var(--color-muted)]">
            Detected from the email already in your browser. Click the masked
            code in Authier to copy and reveal it.
          </p>
        </div>
        <div>
          <PreviewToolbar />
          <div
            className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] shadow-xl"
            data-preview-popup
          >
            <PopupPreview>
              {ready ? <EmailVerificationCodes /> : null}
            </PopupPreview>
          </div>
        </div>
      </div>
    </div>
  )
}
