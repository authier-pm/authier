import { useEffect, useState, useSyncExternalStore } from 'react'
import { CodeMessageKind } from '@src/verification-codes/verificationCodeProtocol'
import type { VerificationCodeCandidate } from '@src/verification-codes/verificationCodeProtocol'
import {
  handleVerificationCodeMessage,
  initializeVerificationCodes,
  type RelayedVerificationCode
} from '@src/background/verificationCodes'
import browser, {
  getPreviewBadgeText,
  setPreviewMessageHandler,
  subscribePreviewBadge
} from '../browserMock'

/** The toolbar icon with the badge the background sets for a new code. */
export const CodePopupToolbar = ({ badgeLabel }: { badgeLabel: string }) => {
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
            aria-label={badgeLabel}
            className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[color:var(--color-background)] bg-red-500"
          />
        ) : null}
      </div>
    </div>
  )
}

/**
 * Runs the production content-script observer and background handler in the
 * page, routing reports as if they came from the web app's tab.
 */
export const useCodePreviewBackground = ({
  reportUrl,
  reportTabId,
<<<<<<< HEAD
  pageUrl,
=======
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
  observe,
  fetchRelayedCodes
}: {
  reportUrl: string
  reportTabId: number
<<<<<<< HEAD
  pageUrl?: string
=======
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
  observe: (
    document: Document,
    report: (candidates: VerificationCodeCandidate[]) => Promise<unknown>
  ) => () => void
  fetchRelayedCodes?: () => Promise<RelayedVerificationCode[]>
}) => {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setPreviewMessageHandler((message) => {
      const isReport =
        typeof message === 'object' &&
        message !== null &&
        'kind' in message &&
        message.kind === CodeMessageKind.REPORT
<<<<<<< HEAD
      const isPageRequest =
        typeof message === 'object' &&
        message !== null &&
        'kind' in message &&
        [
          CodeMessageKind.LIST_FOR_PAGE,
          CodeMessageKind.GET_FOR_PAGE,
          CodeMessageKind.FILLED_FOR_PAGE
        ].some((kind) => kind === message.kind)
      const contentUrl = isReport ? reportUrl : pageUrl
      return handleVerificationCodeMessage(message, {
        id: browser.runtime.id,
        url:
          isReport || isPageRequest
            ? contentUrl
            : browser.runtime.getURL('js/popup.html'),
        frameId: 0,
        ...(isReport || isPageRequest
=======
      return handleVerificationCodeMessage(message, {
        id: browser.runtime.id,
        url: isReport ? reportUrl : browser.runtime.getURL('js/popup.html'),
        frameId: 0,
        ...(isReport
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
          ? {
              tab: {
                id: reportTabId,
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
<<<<<<< HEAD
    void initializeVerificationCodes({
      fetchRelayedCodes,
      pollRelayedInBackground: !!fetchRelayedCodes
    })
=======
    initializeVerificationCodes({ fetchRelayedCodes })
>>>>>>> 0aede066 (Relay SMS verification codes to the browser extension (#104))
    const stop = observe(document, (candidates) =>
      browser.runtime.sendMessage({ kind: CodeMessageKind.REPORT, candidates })
    )
    setReady(true)
    return () => {
      stop()
      setPreviewMessageHandler(undefined)
    }
  }, [])
  return ready
}
