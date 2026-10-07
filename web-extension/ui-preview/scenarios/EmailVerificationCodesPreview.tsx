import { useState, useSyncExternalStore } from 'react'
import { IoMailOutline } from 'react-icons/io5'
import { VerificationCodes } from '@src/verification-codes/VerificationCodes'
import { observeGmailCodes } from '@src/verification-codes/readGmailCodes'
import { Button } from '@src/components/ui/button'
import { PopupPreview } from '../PopupPreview'
import { getPreviewActiveTabId, subscribePreviewTab } from '../browserMock'
import {
  gmailVerificationEmail,
  gmailUnreadVerificationEmail
} from '../fixtures/gmailVerificationEmail'
import { gmailCloudflareEmailRouting } from '../fixtures/cloudflareEmailRouting'
import {
  CodePopupToolbar,
  useCodePreviewBackground
} from './codePreviewBackground'

export const EmailVerificationCodesPreview = () => {
  const isEmailRouting = new URLSearchParams(window.location.search).has(
    'email-routing'
  )
  const [email, setEmail] = useState(
    isEmailRouting ? gmailCloudflareEmailRouting : gmailVerificationEmail
  )
  const ready = useCodePreviewBackground({
    reportUrl: 'https://mail.google.com/mail/u/0/#inbox',
    reportTabId: 42,
    observe: observeGmailCodes
  })
  const activeTabId = useSyncExternalStore(
    subscribePreviewTab,
    getPreviewActiveTabId
  )

  return (
    <div className="mx-auto min-h-screen max-w-[920px] p-8" data-ui-preview>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)]">
        Authier / Email verification
      </p>
      <h1 className="mt-2 mb-8 text-2xl font-semibold">
        {isEmailRouting
          ? 'An email verification link leaves the popup clear.'
          : 'Your email code, one click away.'}
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
            dangerouslySetInnerHTML={{ __html: email }}
          />
          <p className="mt-4 text-xs leading-relaxed text-[color:var(--color-muted)]">
            {isEmailRouting
              ? 'This email verifies an address through a link. The footer’s CA 94107 postal address does not produce a temporary code or notification badge.'
              : 'Detected from the email already in your browser. Click the masked code in Authier to copy and reveal it.'}
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            onClick={() => setEmail(gmailUnreadVerificationEmail)}
          >
            Receive another email code
          </Button>
        </div>
        <div>
          <CodePopupToolbar badgeLabel="New email verification code" />
          <div
            className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] shadow-xl"
            data-preview-popup
          >
            <PopupPreview>{ready ? <VerificationCodes /> : null}</PopupPreview>
          </div>
        </div>
      </div>
    </div>
  )
}
