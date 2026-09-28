<<<<<<< HEAD
import { useState, useSyncExternalStore } from 'react'
=======
import { useSyncExternalStore } from 'react'
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
import {
  IoChatbubbleEllipsesOutline,
  IoPhonePortraitOutline
} from 'react-icons/io5'
import { VerificationCodes } from '@src/verification-codes/VerificationCodes'
import { observeGoogleMessagesCodes } from '@src/verification-codes/readGoogleMessagesCodes'
import type { RelayedVerificationCode } from '@src/background/verificationCodes'
import { Button } from '@src/components/ui/button'
import { PopupPreview } from '../PopupPreview'
import { getPreviewActiveTabId, subscribePreviewTab } from '../browserMock'
import { googleMessagesInbox } from '../fixtures/googleMessagesConversation'
import {
  CodePopupToolbar,
  useCodePreviewBackground
} from './codePreviewBackground'
import './smsVerificationCodesPreview.css'

// Stands in for the backend: already decrypted, as the background would see it.
const phoneRelays: RelayedVerificationCode[] = []
const relaySms = (code: string, sender: string) => {
  phoneRelays.unshift({
    v: 1,
    id: crypto.randomUUID(),
    code,
    sender,
    receivedAt: Date.now(),
    deviceName: 'Google Pixel 9',
    expiresAt: Date.now() + 10 * 60 * 1000
  })
}
<<<<<<< HEAD
const phoneOnly = new URLSearchParams(location.search).has('phone-only')
if (!phoneOnly) relaySms('594172', 'Moneta')

export const SmsVerificationCodesPreview = () => {
  const [popupOpen, setPopupOpen] = useState(!phoneOnly)
  const ready = useCodePreviewBackground({
    reportUrl: 'https://messages.google.com/web/conversations/6',
    reportTabId: 43,
    observe: phoneOnly ? () => () => undefined : observeGoogleMessagesCodes,
=======
relaySms('594172', 'Moneta')

export const SmsVerificationCodesPreview = () => {
  const ready = useCodePreviewBackground({
    reportUrl: 'https://messages.google.com/web/conversations/6',
    reportTabId: 43,
    observe: observeGoogleMessagesCodes,
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
    fetchRelayedCodes: async () => structuredClone(phoneRelays)
  })
  const activeTabId = useSyncExternalStore(
    subscribePreviewTab,
    getPreviewActiveTabId
  )

  return (
    <div className="mx-auto min-h-screen max-w-[1040px] p-8" data-ui-preview>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)]">
        Authier / SMS verification
      </p>
      <h1 className="mt-2 mb-8 text-2xl font-semibold">
        Codes from your phone, in your browser.
      </h1>
      <div className="grid grid-cols-[minmax(0,1fr)_350px] items-start gap-8">
        <div className="grid gap-6">
<<<<<<< HEAD
          {!phoneOnly && (
            <div>
              <div className="mb-3 flex h-[42px] items-center gap-2 text-xs text-[color:var(--color-muted)]">
                <IoChatbubbleEllipsesOutline className="size-4" />
                {activeTabId === 43
                  ? 'Google Messages for Web · active tab'
                  : 'Google Messages for Web · open in another tab'}
              </div>
              <div
                data-messages-fixture
                className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]"
                dangerouslySetInnerHTML={{ __html: googleMessagesInbox }}
              />
            </div>
          )}
=======
          <div>
            <div className="mb-3 flex h-[42px] items-center gap-2 text-xs text-[color:var(--color-muted)]">
              <IoChatbubbleEllipsesOutline className="size-4" />
              {activeTabId === 43
                ? 'Google Messages for Web · active tab'
                : 'Google Messages for Web · open in another tab'}
            </div>
            <div
              data-messages-fixture
              className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]"
              dangerouslySetInnerHTML={{ __html: googleMessagesInbox }}
            />
          </div>
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
          <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5">
            <IoPhonePortraitOutline className="mt-0.5 size-6 shrink-0 text-[color:var(--color-primary)]" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold">Authier for Android · unlocked</p>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-muted)]">
<<<<<<< HEAD
                Google Pixel 9 relays SMS codes encrypted with your vault key.
                The background checks even when the popup is closed.
=======
                Google Pixel 9 relayed a code from Moneta, encrypted with your
                vault key. The server only stores ciphertext for 10 minutes.
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onClick={() => relaySms('4827', 'Revolut')}
              >
                Receive an SMS on the phone
              </Button>
            </div>
          </div>
        </div>
        <div>
          <CodePopupToolbar badgeLabel="New SMS verification code" />
<<<<<<< HEAD
          <Button
            className="mb-3"
            size="sm"
            variant="outline"
            onClick={() => setPopupOpen((open) => !open)}
          >
            {popupOpen ? 'Close popup' : 'Open popup'}
          </Button>
          {!popupOpen && (
            <p className="text-sm text-[color:var(--color-muted)]">
              Popup closed · background checks stay active
            </p>
          )}
          {popupOpen && (
            <div
              className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] shadow-xl"
              data-preview-popup
            >
              <PopupPreview>
                {ready ? <VerificationCodes /> : null}
              </PopupPreview>
            </div>
          )}
=======
          <div
            className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] shadow-xl"
            data-preview-popup
          >
            <PopupPreview>{ready ? <VerificationCodes /> : null}</PopupPreview>
          </div>
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
        </div>
      </div>
    </div>
  )
}
