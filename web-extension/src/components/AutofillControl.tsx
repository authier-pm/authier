import { useContext, useEffect, useRef, useState } from 'react'
import browser from 'webextension-polyfill'
import { TbWand } from 'react-icons/tb'
import {
  AutofillPagePauseMessageKind,
  type AutofillPagePauseGetMessage,
  type AutofillPagePauseRefreshMessage,
  type AutofillPagePauseSetMessage
} from '@src/background/autofillPagePause'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { Button } from './ui/button'
import { Switch } from './ui/switch'

const POPOVER_ID = 'autofill-control-popover'

const isAutofillSupportedUrl = (url: string) =>
  url.startsWith('https://') || url.startsWith('http://')

const getStatusLabel = ({
  enabled,
  loading,
  pageControlAvailable
}: {
  enabled: boolean
  loading: boolean
  pageControlAvailable: boolean
}) => {
  if (!pageControlAvailable) {
    return 'Autofill unavailable'
  }

  if (loading) {
    return 'Autofill…'
  }

  return enabled ? 'Autofill on' : 'Autofill paused'
}

export const AutofillControl = () => {
  const { currentTab, currentURL, deviceState, setSecuritySettings } =
    useContext(DeviceStateContext)
  const [isOpen, setIsOpen] = useState(false)
  const [isPagePaused, setIsPagePaused] = useState<boolean | null>(null)
  const isPointerDownWithinControl = useRef(false)

  const tabId = currentTab?.id
  const globallyEnabled = deviceState?.autofillCredentialsEnabled ?? false
  const pageControlAvailable =
    typeof tabId === 'number' && isAutofillSupportedUrl(currentURL)
  const autofillEnabledForPage =
    globallyEnabled && pageControlAvailable && isPagePaused === false

  useEffect(() => {
    let isCurrent = true

    if (!pageControlAvailable || typeof tabId !== 'number') {
      setIsPagePaused(null)
      return () => {
        isCurrent = false
      }
    }

    const message: AutofillPagePauseGetMessage = {
      kind: AutofillPagePauseMessageKind.GET,
      tabId,
      url: currentURL
    }

    browser.runtime.sendMessage(message).then((paused: unknown) => {
      if (isCurrent) {
        setIsPagePaused(paused === true)
      }
    })

    return () => {
      isCurrent = false
    }
  }, [currentURL, pageControlAvailable, tabId])

  if (!deviceState) {
    return null
  }

  const setPageAutofillEnabled = async (enabled: boolean) => {
    if (!pageControlAvailable || typeof tabId !== 'number') {
      return
    }

    const message: AutofillPagePauseSetMessage = {
      kind: AutofillPagePauseMessageKind.SET,
      paused: !enabled,
      tabId,
      url: currentURL
    }
    const paused = await browser.runtime.sendMessage(message)

    setIsPagePaused(paused === true)
  }

  const setGlobalAutofillEnabled = async (enabled: boolean) => {
    await setSecuritySettings({
      autofillCredentialsEnabled: enabled,
      autofillTOTPEnabled: deviceState.autofillTOTPEnabled,
      autofillForbiddenUrlPatterns: deviceState.autofillForbiddenUrlPatterns,
      notificationOnVaultUnlock: deviceState.notificationOnVaultUnlock,
      notificationOnWrongPasswordAttempts:
        deviceState.notificationOnWrongPasswordAttempts,
      syncTOTP: deviceState.syncTOTP,
      uiLanguage: deviceState.uiLanguage,
      vaultLockTimeoutSeconds: deviceState.vaultLockTimeoutSeconds
    })

    if (typeof tabId === 'number') {
      const message: AutofillPagePauseRefreshMessage = {
        kind: AutofillPagePauseMessageKind.REFRESH
      }

      void browser.tabs.sendMessage(tabId, message).catch(() => undefined)
    }
  }

  const statusLabel = getStatusLabel({
    enabled: autofillEnabledForPage,
    loading: isPagePaused === null,
    pageControlAvailable
  })

  return (
    <div
      className="relative shrink-0"
      onBlur={(event) => {
        if (isPointerDownWithinControl.current) {
          return
        }

        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setIsOpen(false)
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsOpen(false)
        }
      }}
      onPointerDownCapture={() => {
        isPointerDownWithinControl.current = true
        window.setTimeout(() => {
          isPointerDownWithinControl.current = false
        }, 0)
      }}
    >
      <Button
        aria-controls={POPOVER_ID}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={statusLabel}
        className="h-10 w-10 flex-col gap-0 px-0 py-1"
        size="icon"
        title={statusLabel}
        variant={autofillEnabledForPage ? 'outline' : 'secondary'}
        onClick={() => {
          setIsOpen((currentValue) => !currentValue)
        }}
      >
        <TbWand className="size-4" />
        <span className="text-[8px] leading-[9px] font-normal tracking-tight">
          Autofill
        </span>
      </Button>

      {isOpen ? (
        <div
          aria-label="Autofill controls"
          className="absolute top-full right-0 z-50 mt-2 w-64 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3 shadow-xl"
          id={POPOVER_ID}
          role="dialog"
        >
          <div className="mb-3">
            <div className="text-sm font-semibold text-[color:var(--color-foreground)]">
              Autofill controls
            </div>
            <div className="text-xs text-[color:var(--color-muted)]">
              Pause autofill for this page or the whole browser.
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-[color:var(--color-foreground)]">
                  This page
                </div>
                <div className="text-xs text-[color:var(--color-muted)]">
                  {pageControlAvailable
                    ? 'The pause clears when you navigate away.'
                    : 'Unavailable on this browser page.'}
                </div>
              </div>
              <Switch
                aria-label="Autofill on this page"
                checked={autofillEnabledForPage}
                disabled={
                  !globallyEnabled ||
                  !pageControlAvailable ||
                  isPagePaused === null
                }
                onCheckedChange={(checked) => {
                  void setPageAutofillEnabled(checked)
                }}
              />
            </div>

            <div className="h-px bg-[color:var(--color-border)]" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-[color:var(--color-foreground)]">
                  All pages
                </div>
                <div className="text-xs text-[color:var(--color-muted)]">
                  Stored only in this browser.
                </div>
              </div>
              <Switch
                aria-label="Autofill on all pages"
                checked={globallyEnabled}
                onCheckedChange={(checked) => {
                  void setGlobalAutofillEnabled(checked)
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
