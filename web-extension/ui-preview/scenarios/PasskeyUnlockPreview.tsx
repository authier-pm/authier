import { useState } from 'react'
import { DeviceUnlockSettings } from '@shared/DeviceUnlockSettings'
import { DeviceUnlockButton } from '@shared/DeviceUnlockButton'
import {
  cancelDeviceUnlock,
  enableDeviceUnlock,
  forgetDeviceUnlock,
  unlockWithDevice
} from '@shared/deviceUnlock'
import { bufferToBase64 } from '@shared/cryptoUtils'

const accountId = 'preview-account'
const reportKey = (key: string) =>
  window.dispatchEvent(new CustomEvent('preview-vault-key', { detail: key }))

export function PasskeyUnlockPreview() {
  const [view, setView] = useState(
    new URLSearchParams(location.search).has('locked') ? 'locked' : 'settings'
  )
  const [masterKey] = useState(() =>
    bufferToBase64(crypto.getRandomValues(new Uint8Array(32)))
  )
  const lock = async () => {
    await cancelDeviceUnlock()
    setView('locked')
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <article className="w-full max-w-lg space-y-6 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-7 shadow-xl">
        <header>
          <p className="text-sm font-semibold tracking-widest text-[color:var(--color-primary)]">
            AUTHIER
          </p>
          <h1 className="mt-4 text-2xl font-bold">
            {view === 'locked' ? 'Unlock your vault' : 'Your vault'}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            alex@example.com
          </p>
        </header>
        {view === 'settings' && (
          <>
            <DeviceUnlockSettings
              accountId={accountId}
              onEnable={async () => {
                reportKey(masterKey)
                await enableDeviceUnlock(
                  { accountId, email: 'alex@example.com', masterKey },
                  () => true
                )
              }}
            />
            <button
              className="text-sm underline"
              type="button"
              onClick={() => void lock()}
            >
              Lock vault
            </button>
          </>
        )}
        {view === 'locked' && (
          <>
            <p className="text-sm text-[color:var(--color-muted)]">
              Use your passkey or master password to unlock this browser.
            </p>
            <DeviceUnlockButton
              accountId={accountId}
              onUnlock={async () => {
                reportKey(await unlockWithDevice(accountId))
                setView('unlocked')
              }}
            />
            <label className="block text-sm">
              Master password
              <input
                type="password"
                autoComplete="off"
                className="mt-2 w-full rounded-lg border border-[color:var(--color-border)] bg-transparent p-3"
              />
            </label>
          </>
        )}
        {view === 'unlocked' && (
          <>
            <p role="status">Vault unlocked</p>
            <button type="button" onClick={() => void lock()}>
              Lock vault
            </button>
            <button
              type="button"
              onClick={async () => {
                await forgetDeviceUnlock()
                setView('locked')
              }}
            >
              Log out
            </button>
          </>
        )}
      </article>
    </main>
  )
}
