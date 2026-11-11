import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import {
  forgetRememberedVault,
  readRememberedVault,
  rememberVault
} from '@shared/rememberedVault'
import { device, VAULT_LOCK_ALARM } from './ExtensionDevice'
import type { IBackgroundStateSerializable } from './backgroundPage'
import { mockPersistentVaultStorage } from '../../tests/vaultStorage'
import { lockedVaultSnapshotSchema } from './lockedVaultStorage'

const alarmState = vi.hoisted(() => ({
  listener: undefined as ((alarm: { name: string }) => void) | undefined
}))

vi.mock('@src/apollo/apolloClient', () => ({
  apolloClient: { query: vi.fn(), mutate: vi.fn() }
}))
vi.mock('@src/ExtensionProviders', () => ({ toast: vi.fn() }))
vi.mock('./ExtensionDevice', async () => {
  location.href = 'chrome-extension://mock-extension-id/js/backgroundPage.html'
  location.pathname = '/js/backgroundPage.html'
  return vi.importActual('./ExtensionDevice')
})
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      connect: vi.fn().mockReturnValue({}),
      getURL: (path: string) => path
    },
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn()
      },
      session: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn()
      },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
    },
    action: { setIcon: vi.fn() },
    alarms: {
      create: vi.fn(),
      clear: vi.fn().mockResolvedValue(true),
      onAlarm: {
        addListener: (listener: (alarm: { name: string }) => void) => {
          alarmState.listener = listener
        }
      }
    }
  }
}))

const snapshot = (): IBackgroundStateSerializable => ({
  email: 'audit@example.test',
  userId: 'audit-user',
  deviceName: 'browser',
  encryptionSalt: 'salt',
  masterEncryptionKey: 'test-key',
  authSecret: 'test-enrollment',
  authSecretEncrypted: 'ciphertext',
  secrets: [],
  vaultLockTimeoutSeconds: 300,
  syncTOTP: true,
  autofillCredentialsEnabled: true,
  autofillTOTPEnabled: true,
  autofillForbiddenUrlPatterns: '',
  uiLanguage: 'en',
  theme: 'dark',
  notificationOnVaultUnlock: false,
  notificationOnWrongPasswordAttempts: 3
})

let storage: ReturnType<typeof mockPersistentVaultStorage>

beforeEach(async () => {
  await device.clearLockInterval()
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-11T10:00:00Z'))
  storage = mockPersistentVaultStorage()
  device.state?.destroy()
  device.state = null
  device.lockedState = null
  vi.mocked(readRememberedVault).mockResolvedValue(null)
})

afterEach(async () => {
  await device.clearLockInterval()
  device.state?.destroy()
  device.state = null
  vi.useRealTimers()
})

describe('vault lock deadline enforcement', () => {
  it('persists seconds as an absolute deadline and erases keys at that deadline', async () => {
    const now = Date.now()
    await device.save(snapshot())
    await device.setLockTime(5)
    const unlocked = device.state!
    expect(unlocked.lockTimeEnd).toBe(now + 5_000)
    expect(storage.session.backgroundState).toMatchObject({
      lockTimeEnd: now + 5_000,
      vaultLockTimeoutSeconds: 5
    })
    expect(browser.alarms.create).toHaveBeenLastCalledWith(VAULT_LOCK_ALARM, {
      when: now + 5_000
    })
    await vi.advanceTimersByTimeAsync(5_000)
    expect(device.state).toBeNull()
    expect(unlocked.masterEncryptionKey).toBe('')
    expect(unlocked.authSecret).toBe('')
    expect(storage.session.backgroundState).toBeNull()
    expect(storage.session.lockedState).not.toHaveProperty(
      'masterEncryptionKey'
    )
    expect(forgetRememberedVault).toHaveBeenCalled()
  })

  it('keeps the original deadline across worker restarts and opening extension pages', async () => {
    const deadline = Date.now() + 20_000
    storage.session.backgroundState = { ...snapshot(), lockTimeEnd: deadline }
    await device.initialize()
    expect(device.state?.lockTimeEnd).toBe(deadline)
    await vi.advanceTimersByTimeAsync(10_000)
    device.state?.destroy()
    device.state = null
    await device.initialize()
    expect(device.state?.lockTimeEnd).toBe(deadline)
    expect(browser.alarms.create).toHaveBeenLastCalledWith(VAULT_LOCK_ALARM, {
      when: deadline
    })
    await vi.advanceTimersByTimeAsync(10_000)
    expect(device.state).toBeNull()
  })

  it.each([
    { lockTimeEnd: undefined },
    { lockTimeEnd: 1 },
    { lockTimeEnd: Number.MAX_SAFE_INTEGER },
    {
      lockTimeEnd: Number.MAX_SAFE_INTEGER,
      vaultLockTimeoutSeconds: 1_700_000_000_000
    }
  ])(
    'rejects expired or invalid remembered deadlines before reopening the vault: %j',
    async (values) => {
      vi.mocked(readRememberedVault).mockResolvedValue({
        ...snapshot(),
        ...values
      })
      await device.initialize()
      expect(device.state).toBeNull()
      expect(storage.session.backgroundState).toBeNull()
      expect(device.lockedState?.authSecretEncrypted).toBe('ciphertext')
      expect(rememberVault).not.toHaveBeenCalled()
    }
  )

  it('zero disables locking and removes the previous deadline', async () => {
    await device.save(snapshot())
    await device.setLockTime(0)
    expect(device.state?.lockTimeEnd).toBeNull()
    expect(browser.alarms.clear).toHaveBeenCalledWith(VAULT_LOCK_ALARM)
    await vi.advanceTimersByTimeAsync(24 * 3600_000)
    expect(device.state?.masterEncryptionKey).toBe('test-key')
    device.state?.destroy()
    device.state = null
    await device.initialize()
    expect(device.state?.masterEncryptionKey).toBe('test-key')
  })

  it('enforces an expired deadline immediately on a request after sleep', async () => {
    await device.save(snapshot())
    vi.setSystemTime(Date.now() + 301_000)
    expect(await device.ensureUnlocked()).toBe(false)
    expect(device.state).toBeNull()
  })

  it('locks when the browser alarm wakes a worker whose JavaScript timer did not run', async () => {
    await device.save(snapshot())
    if (device.lockInterval) clearInterval(device.lockInterval)
    device.lockInterval = null
    vi.setSystemTime(Date.now() + 301_000)
    expect(alarmState.listener).toBeDefined()
    alarmState.listener!({ name: VAULT_LOCK_ALARM })
    await vi.advanceTimersByTimeAsync(0)
    expect(device.state).toBeNull()
    expect(storage.session.backgroundState).toBeNull()
  })

  it('keeps the original timeout when background authentication renews the same account', async () => {
    await device.save(snapshot())
    const deadline = device.state?.lockTimeEnd
    await vi.advanceTimersByTimeAsync(30_000)
    await device.save({ ...snapshot(), authSecret: 'renewed-secret' })
    expect(device.state?.lockTimeEnd).toBe(deadline)
  })

  it('invalidates the in-memory session before asynchronous lock persistence finishes', async () => {
    await device.save(snapshot())
    const state = device.state!
    let finishPersistence!: () => void
    vi.mocked(forgetRememberedVault).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishPersistence = resolve
      })
    )
    const locking = device.lock()
    expect(device.state).toBeNull()
    expect(state.masterEncryptionKey).toBe('')
    expect(state.authSecret).toBe('')
    finishPersistence()
    await locking
  })

  it('removes the previous deadline from a locked snapshot so a password unlock starts a fresh timeout', async () => {
    const locked = lockedVaultSnapshotSchema.parse({
      ...snapshot(),
      lockTimeEnd: 1
    })
    expect(locked).not.toHaveProperty('lockTimeEnd')
    await device.save({
      ...locked,
      masterEncryptionKey: 'new-key',
      authSecret: 'new-secret'
    })
    expect(device.state?.lockTimeEnd).toBe(Date.now() + 300_000)
  })

  it('rejects accidental millisecond timestamps as timeout settings', async () => {
    await device.save(snapshot())
    await expect(device.setLockTime(Date.now())).rejects.toThrow()
    expect(device.state?.vaultLockTimeoutSeconds).toBe(300)
  })
})
