import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, expect, it, beforeEach } from 'vitest'
import {
  bufferToBase64,
  cryptoKeyToString,
  encryptString,
  generateEncryptionKey,
  initLocalDeviceAuthSecret
} from '@shared/cryptoUtils'
import type { VaultApiOutputs } from '@shared/orpc/contract'
import { setAccessToken } from '@/lib/accessToken'
import { encryptLoginSecret } from '@/lib/vaultSecrets'
import { VaultSessionProvider, useVaultSession } from './VaultSessionProvider'

const orpcMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  refreshTokens: vi.fn(),
  markAsSynced: vi.fn(),
  syncSecrets: vi.fn(),
  register: vi.fn(),
  requestDeviceChallenge: vi.fn(),
  completeDeviceLogin: vi.fn(),
  initiateMasterDeviceReset: vi.fn(),
  logout: vi.fn(),
  createSecret: vi.fn(),
  updateSecret: vi.fn(),
  deleteSecret: vi.fn()
}))

vi.mock('@/lib/orpc', () => ({
  orpcClient: {
    auth: {
      refresh: orpcMocks.refresh,
      refreshTokens: orpcMocks.refreshTokens,
      register: orpcMocks.register,
      requestDeviceChallenge: orpcMocks.requestDeviceChallenge,
      completeDeviceLogin: orpcMocks.completeDeviceLogin,
      initiateMasterDeviceReset: orpcMocks.initiateMasterDeviceReset,
      logout: orpcMocks.logout
    },
    session: {
      markAsSynced: orpcMocks.markAsSynced,
      syncSecrets: orpcMocks.syncSecrets
    },
    vault: {
      createSecret: orpcMocks.createSecret,
      updateSecret: orpcMocks.updateSecret,
      deleteSecret: orpcMocks.deleteSecret
    }
  }
}))

type SessionBootstrap = VaultApiOutputs['session']['bootstrap']
type SecretRecord = SessionBootstrap['secrets'][number]
type SyncedSecretRecord = VaultApiOutputs['session']['syncSecrets']['secrets'][number]

const createSession = ({
  secrets,
  lastSyncAt = null
}: {
  secrets: SecretRecord[]
  lastSyncAt?: string | null
}): SessionBootstrap => ({
  user: {
    id: 'user-1',
    email: 'capaj@test.com',
    masterDeviceId: 'device-1',
    newDevicePolicy: 'ALLOW',
    deviceRecoveryCooldownMinutes: 960
  },
  currentDevice: {
    id: 'device-1',
    name: 'Primary browser',
    platform: 'web',
    syncTOTP: true,
    vaultLockTimeoutSeconds: 28800,
    createdAt: new Date('2026-03-25T10:00:00.000Z').toISOString(),
    lastSyncAt,
    logoutAt: null
  },
  secrets,
  pendingChallenges: []
})

const storeLockedState = ({
  authSecretEncrypted,
  encryptionSalt,
  userId = 'user-1'
}: {
  authSecretEncrypted: string
  encryptionSalt: string
  userId?: string
}) => {
  window.localStorage.setItem(
    'authier-vault-locked-state',
    JSON.stringify({
      userId,
      email: 'capaj@test.com',
      deviceName: 'Primary browser',
      encryptionSalt,
      authSecretEncrypted,
      vaultLockTimeoutSeconds: 28800
    })
  )
}

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return {
    promise,
    reject,
    resolve
  }
}

const createSyncedSecret = (
  secret: SecretRecord,
  deletedAt: string | null = null
): SyncedSecretRecord => ({
  ...secret,
  deletedAt
})

function VaultSessionHarness() {
  const {
    createLoginSecret,
    decryptedSecrets,
    deleteSecret,
    isSyncingVault,
    session,
    status,
    syncVault,
    unlockVault,
    updateLoginSecret
  } = useVaultSession()

  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="sync-state">{isSyncingVault ? 'syncing' : 'idle'}</p>
      <p data-testid="last-sync">{session?.currentDevice.lastSyncAt ?? 'never'}</p>
      <button onClick={() => void unlockVault('super secure password')} type="button">
        Unlock
      </button>
      <button onClick={() => void syncVault()} type="button">
        Sync
      </button>
      <button
        onClick={() =>
          void createLoginSecret({
            label: 'Linear',
            url: 'https://linear.app',
            iconUrl: null,
            username: 'ops@authier.pm',
            password: 'generated-password',
            androidUri: null,
            iosUri: null
          })
        }
        type="button"
      >
        Create
      </button>
      <button
        onClick={() =>
          void updateLoginSecret('secret-1', {
            label: 'GitHub Updated',
            url: 'https://github.com',
            iconUrl: null,
            username: 'capaj',
            password: 'rotated-password',
            androidUri: null,
            iosUri: null
          })
        }
        type="button"
      >
        Update
      </button>
      <button onClick={() => void deleteSecret('secret-1')} type="button">
        Delete
      </button>
      <ul>
        {decryptedSecrets.map((secret) => (
          <li key={secret.id}>
            {secret.kind === 'LOGIN_CREDENTIALS'
              ? secret.loginCredentials.label
              : secret.totp.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

describe('VaultSessionProvider', () => {
  beforeEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
    setAccessToken(null)
    orpcMocks.refresh.mockReset()
    orpcMocks.refreshTokens.mockReset()
    orpcMocks.markAsSynced.mockReset()
    orpcMocks.syncSecrets.mockReset()
    orpcMocks.register.mockReset()
    orpcMocks.requestDeviceChallenge.mockReset()
    orpcMocks.completeDeviceLogin.mockReset()
    orpcMocks.initiateMasterDeviceReset.mockReset()
    orpcMocks.logout.mockReset()
    orpcMocks.createSecret.mockReset()
    orpcMocks.updateSecret.mockReset()
    orpcMocks.deleteSecret.mockReset()
    orpcMocks.refreshTokens.mockResolvedValue({
      accessToken: 'access-token-sync',
      refreshToken: 'refresh-token-sync'
    })
    orpcMocks.markAsSynced.mockResolvedValue({
      lastSyncAt: new Date('2026-03-25T12:00:00.000Z').toISOString()
    })
    orpcMocks.syncSecrets.mockResolvedValue({
      secrets: []
    })
  })

  it('unlocks local vault state and keeps secret CRUD encrypted client-side', async () => {
    const password = 'super secure password'
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const encryptionSalt = bufferToBase64(salt)
    const masterKey = await generateEncryptionKey(password, salt)
    const deviceSecrets = await initLocalDeviceAuthSecret(masterKey, salt)
    const existingEncryptedSecret = await encryptLoginSecret(
      {
        label: 'GitHub',
        url: 'https://github.com',
        iconUrl: null,
        username: 'capaj',
        password: 'hunter2',
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )

    window.localStorage.setItem('authier-vault-refresh-token', 'refresh-token-1')
    window.localStorage.setItem(
      'authier-vault-locked-state',
      JSON.stringify({
        userId: 'user-1',
        email: 'capaj@test.com',
        deviceName: 'Primary browser',
        encryptionSalt,
        authSecretEncrypted: deviceSecrets.addDeviceSecretEncrypted,
        vaultLockTimeoutSeconds: 28800
      })
    )

    orpcMocks.refresh.mockResolvedValue({
      accessToken: 'access-token-2',
      refreshToken: 'refresh-token-2',
      session: {
        user: {
          id: 'user-1',
          email: 'capaj@test.com',
          masterDeviceId: 'device-1',
          newDevicePolicy: 'ALLOW',
          deviceRecoveryCooldownMinutes: 960
        },
        currentDevice: {
          id: 'device-1',
          name: 'Primary browser',
          platform: 'web',
          syncTOTP: true,
          vaultLockTimeoutSeconds: 28800,
          createdAt: new Date('2026-03-25T10:00:00.000Z').toISOString(),
          lastSyncAt: new Date().toISOString(),
          logoutAt: null
        },
        secrets: [
          {
            id: 'secret-1',
            encrypted: existingEncryptedSecret,
            kind: 'LOGIN_CREDENTIALS',
            version: 1,
            createdAt: new Date('2026-03-25T10:01:00.000Z').toISOString(),
            updatedAt: null
          },
          {
            id: 'secret-legacy',
            encrypted: await encryptString(
              masterKey,
              JSON.stringify({
                label: 'Legacy item',
                url: 'https://legacy.example',
                username: 'legacy-user',
                password: 'legacy-password'
              }),
              salt
            ),
            kind: 'LOGIN_CREDENTIALS',
            version: 1,
            createdAt: new Date('2026-03-25T10:01:30.000Z').toISOString(),
            updatedAt: null
          },
          {
            id: 'secret-broken',
            encrypted: await encryptString(masterKey, 'not json', salt),
            kind: 'TOTP',
            version: 1,
            createdAt: new Date('2026-03-25T10:01:45.000Z').toISOString(),
            updatedAt: null
          }
        ],
        pendingChallenges: []
      }
    })
    orpcMocks.createSecret.mockImplementation(async ({ encrypted, kind }) => ({
      id: 'secret-2',
      encrypted,
      kind,
      version: 1,
      createdAt: new Date('2026-03-25T10:02:00.000Z').toISOString(),
      updatedAt: null
    }))
    orpcMocks.updateSecret.mockImplementation(async ({ id, patch }) => ({
      id,
      encrypted: patch.encrypted,
      kind: patch.kind,
      version: 2,
      createdAt: new Date('2026-03-25T10:01:00.000Z').toISOString(),
      updatedAt: new Date('2026-03-25T10:03:00.000Z').toISOString()
    }))
    orpcMocks.deleteSecret.mockResolvedValue({
      id: 'secret-1'
    })

    const user = userEvent.setup()

    render(
      <VaultSessionProvider>
        <VaultSessionHarness />
      </VaultSessionProvider>
    )

    expect(screen.getByTestId('status')).toHaveTextContent('locked')

    await user.click(screen.getByRole('button', { name: 'Unlock' }))

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })
    expect(await screen.findByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Legacy item')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(screen.getByText('Linear')).toBeInTheDocument()
    })
    expect(orpcMocks.createSecret).toHaveBeenCalledOnce()
    expect(orpcMocks.createSecret.mock.calls[0]?.[0].encrypted).not.toContain(
      'Linear'
    )

    await user.click(screen.getByRole('button', { name: 'Update' }))

    await waitFor(() => {
      expect(screen.getByText('GitHub Updated')).toBeInTheDocument()
    })
    expect(orpcMocks.updateSecret).toHaveBeenCalledOnce()
    expect(orpcMocks.updateSecret.mock.calls[0]?.[0].patch.encrypted).not.toContain(
      'rotated-password'
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.queryByText('GitHub Updated')).not.toBeInTheDocument()
    })
    expect(orpcMocks.deleteSecret).toHaveBeenCalledWith({
      id: 'secret-1'
    })
  })

  it('restores the unlocked vault state after a remount without requiring another unlock', async () => {
    const password = 'super secure password'
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const encryptionSalt = bufferToBase64(salt)
    const masterKey = await generateEncryptionKey(password, salt)
    const deviceSecrets = await initLocalDeviceAuthSecret(masterKey, salt)
    const existingEncryptedSecret = await encryptLoginSecret(
      {
        label: 'GitHub',
        url: 'https://github.com',
        iconUrl: null,
        username: 'capaj',
        password: 'hunter2',
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )

    const session = {
      user: {
        id: 'user-1',
        email: 'capaj@test.com',
        masterDeviceId: 'device-1',
        newDevicePolicy: 'ALLOW',
        deviceRecoveryCooldownMinutes: 960
      },
      currentDevice: {
        id: 'device-1',
        name: 'Primary browser',
        platform: 'web',
        syncTOTP: true,
        vaultLockTimeoutSeconds: 28800,
        createdAt: new Date('2026-03-25T10:00:00.000Z').toISOString(),
        lastSyncAt: new Date().toISOString(),
        logoutAt: null
      },
      secrets: [
        {
          id: 'secret-1',
          encrypted: existingEncryptedSecret,
          kind: 'LOGIN_CREDENTIALS' as const,
          version: 1,
          createdAt: new Date('2026-03-25T10:01:00.000Z').toISOString(),
          updatedAt: null
        }
      ],
      pendingChallenges: []
    }

    window.localStorage.setItem('authier-vault-refresh-token', 'refresh-token-1')
    window.localStorage.setItem(
      'authier-vault-locked-state',
      JSON.stringify({
        userId: 'user-1',
        email: 'capaj@test.com',
        deviceName: 'Primary browser',
        encryptionSalt,
        authSecretEncrypted: deviceSecrets.addDeviceSecretEncrypted,
        vaultLockTimeoutSeconds: 28800
      })
    )
    window.localStorage.setItem(
      'authier-vault-unlocked-state',
      JSON.stringify({
        session,
        masterKey: await cryptoKeyToString(masterKey)
      })
    )
    window.localStorage.setItem('authier-vault-access-token', 'access-token-1')

    orpcMocks.refreshTokens.mockResolvedValue({
      accessToken: 'access-token-2',
      refreshToken: 'refresh-token-2'
    })

    render(
      <VaultSessionProvider>
        <VaultSessionHarness />
      </VaultSessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })
    expect(await screen.findByText('GitHub')).toBeInTheDocument()
    expect(orpcMocks.refreshTokens).toHaveBeenCalledWith({
      refreshToken: 'refresh-token-1'
    })
  })

  it('re-authenticates the trusted device on unlock when the refresh token is missing', async () => {
    const password = 'super secure password'
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const encryptionSalt = bufferToBase64(salt)
    const masterKey = await generateEncryptionKey(password, salt)
    const deviceSecrets = await initLocalDeviceAuthSecret(masterKey, salt)
    const existingEncryptedSecret = await encryptLoginSecret(
      {
        label: 'GitHub',
        url: 'https://github.com',
        iconUrl: null,
        username: 'capaj',
        password: 'hunter2',
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )

    window.localStorage.setItem(
      'authier-vault-locked-state',
      JSON.stringify({
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'capaj@test.com',
        deviceName: 'Primary browser',
        encryptionSalt,
        authSecretEncrypted: deviceSecrets.addDeviceSecretEncrypted,
        vaultLockTimeoutSeconds: 28800
      })
    )

    orpcMocks.requestDeviceChallenge.mockResolvedValue({
      status: 'approved',
      challengeId: 42,
      userId: '11111111-1111-1111-1111-111111111111',
      deviceId: 'device-1',
      deviceName: 'Primary browser',
      approvedAt: new Date('2026-03-25T10:00:00.000Z').toISOString(),
      addDeviceSecretEncrypted: deviceSecrets.addDeviceSecretEncrypted,
      encryptionSalt
    })
    orpcMocks.completeDeviceLogin.mockResolvedValue({
      accessToken: 'access-token-2',
      refreshToken: 'refresh-token-2',
      session: {
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'capaj@test.com',
          masterDeviceId: 'device-1',
          newDevicePolicy: 'ALLOW',
          deviceRecoveryCooldownMinutes: 960
        },
        currentDevice: {
          id: 'device-1',
          name: 'Primary browser',
          platform: 'web',
          syncTOTP: true,
          vaultLockTimeoutSeconds: 28800,
          createdAt: new Date('2026-03-25T10:00:00.000Z').toISOString(),
          lastSyncAt: new Date().toISOString(),
          logoutAt: null
        },
        secrets: [
          {
            id: '11111111-1111-1111-1111-111111111112',
            encrypted: existingEncryptedSecret,
            kind: 'LOGIN_CREDENTIALS',
            version: 1,
            createdAt: new Date('2026-03-25T10:01:00.000Z').toISOString(),
            updatedAt: null
          }
        ],
        pendingChallenges: []
      }
    })

    const user = userEvent.setup()

    render(
      <VaultSessionProvider>
        <VaultSessionHarness />
      </VaultSessionProvider>
    )

    expect(screen.getByTestId('status')).toHaveTextContent('locked')

    await user.click(screen.getByRole('button', { name: 'Unlock' }))

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })
    expect(await screen.findByText('GitHub')).toBeInTheDocument()
    expect(orpcMocks.refresh).not.toHaveBeenCalled()
    expect(orpcMocks.requestDeviceChallenge).toHaveBeenCalledWith({
      email: 'capaj@test.com',
      deviceInput: expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        platform: expect.any(String)
      })
    })
    expect(orpcMocks.completeDeviceLogin).toHaveBeenCalledOnce()
  })

  it('syncs the vault manually and updates the sync timestamp after the sync mutation completes', async () => {
    const password = 'super secure password'
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const encryptionSalt = bufferToBase64(salt)
    const masterKey = await generateEncryptionKey(password, salt)
    const deviceSecrets = await initLocalDeviceAuthSecret(masterKey, salt)
    const existingEncryptedSecret = await encryptLoginSecret(
      {
        label: 'GitHub',
        url: 'https://github.com',
        iconUrl: null,
        username: 'capaj',
        password: 'hunter2',
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )
    const syncedEncryptedSecret = await encryptLoginSecret(
      {
        label: 'Linear',
        url: 'https://linear.app',
        iconUrl: null,
        username: 'ops@authier.pm',
        password: 'generated-password',
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )

    window.localStorage.setItem('authier-vault-refresh-token', 'refresh-token-1')
    storeLockedState({
      authSecretEncrypted: deviceSecrets.addDeviceSecretEncrypted,
      encryptionSalt
    })

    orpcMocks.refresh.mockResolvedValueOnce({
      accessToken: 'access-token-2',
      refreshToken: 'refresh-token-2',
      session: createSession({
        lastSyncAt: new Date().toISOString(),
        secrets: [
          {
            id: 'secret-1',
            encrypted: existingEncryptedSecret,
            kind: 'LOGIN_CREDENTIALS',
            version: 1,
            createdAt: new Date('2026-03-25T10:01:00.000Z').toISOString(),
            updatedAt: null
          }
        ]
      })
    })

    const user = userEvent.setup()

    render(
      <VaultSessionProvider>
        <VaultSessionHarness />
      </VaultSessionProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Unlock' }))

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })

    orpcMocks.refreshTokens.mockReset()
    orpcMocks.syncSecrets.mockReset()
    orpcMocks.markAsSynced.mockReset()

    const deferredSync = createDeferred<{
      secrets: SyncedSecretRecord[]
    }>()

    orpcMocks.refreshTokens.mockResolvedValueOnce({
      accessToken: 'access-token-3',
      refreshToken: 'refresh-token-3'
    })
    orpcMocks.syncSecrets.mockReturnValueOnce(deferredSync.promise)
    orpcMocks.markAsSynced.mockResolvedValueOnce({
      lastSyncAt: new Date('2026-03-25T11:00:00.000Z').toISOString()
    })

    await user.click(screen.getByRole('button', { name: 'Sync' }))

    expect(screen.getByTestId('sync-state')).toHaveTextContent('syncing')

    deferredSync.resolve({
      secrets: [
        createSyncedSecret({
          id: 'secret-2',
          encrypted: syncedEncryptedSecret,
          kind: 'LOGIN_CREDENTIALS',
          version: 1,
          createdAt: new Date('2026-03-25T10:30:00.000Z').toISOString(),
          updatedAt: null
        })
      ]
    })

    await waitFor(() => {
      expect(screen.getByText('Linear')).toBeInTheDocument()
    })

    expect(orpcMocks.refreshTokens).toHaveBeenCalledWith({
      refreshToken: 'refresh-token-2'
    })
    expect(orpcMocks.syncSecrets).toHaveBeenCalledWith({})
    expect(orpcMocks.markAsSynced).toHaveBeenCalledWith({})
    expect(screen.getByTestId('sync-state')).toHaveTextContent('idle')
    expect(screen.getByTestId('last-sync')).toHaveTextContent(
      '2026-03-25T11:00:00.000Z'
    )
  })

  it('syncs the vault on startup when the restored session has gone stale', async () => {
    const password = 'super secure password'
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const encryptionSalt = bufferToBase64(salt)
    const masterKey = await generateEncryptionKey(password, salt)
    const deviceSecrets = await initLocalDeviceAuthSecret(masterKey, salt)
    const existingEncryptedSecret = await encryptLoginSecret(
      {
        label: 'GitHub',
        url: 'https://github.com',
        iconUrl: null,
        username: 'capaj',
        password: 'hunter2',
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )
    const syncedEncryptedSecret = await encryptLoginSecret(
      {
        label: 'Linear',
        url: 'https://linear.app',
        iconUrl: null,
        username: 'ops@authier.pm',
        password: 'generated-password',
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )

    const staleLastSyncAt = new Date('2026-03-20T10:00:00.000Z').toISOString()
    const staleSession = createSession({
      lastSyncAt: staleLastSyncAt,
      secrets: [
        {
          id: 'secret-1',
          encrypted: existingEncryptedSecret,
          kind: 'LOGIN_CREDENTIALS',
          version: 1,
          createdAt: new Date('2026-03-25T10:01:00.000Z').toISOString(),
          updatedAt: null
        }
      ]
    })

    window.localStorage.setItem('authier-vault-refresh-token', 'refresh-token-1')
    storeLockedState({
      authSecretEncrypted: deviceSecrets.addDeviceSecretEncrypted,
      encryptionSalt
    })
    window.localStorage.setItem(
      'authier-vault-unlocked-state',
      JSON.stringify({
        session: staleSession,
        masterKey: await cryptoKeyToString(masterKey)
      })
    )
    window.localStorage.setItem('authier-vault-access-token', 'access-token-1')

    orpcMocks.refreshTokens.mockResolvedValueOnce({
      accessToken: 'access-token-2',
      refreshToken: 'refresh-token-2'
    })
    orpcMocks.refreshTokens.mockResolvedValueOnce({
      accessToken: 'access-token-3',
      refreshToken: 'refresh-token-3'
    })
    orpcMocks.syncSecrets.mockResolvedValueOnce({
      secrets: [
        createSyncedSecret({
          id: 'secret-2',
          encrypted: syncedEncryptedSecret,
          kind: 'LOGIN_CREDENTIALS',
          version: 1,
          createdAt: new Date('2026-03-25T10:30:00.000Z').toISOString(),
          updatedAt: null
        })
      ]
    })
    orpcMocks.markAsSynced.mockResolvedValueOnce({
      lastSyncAt: new Date('2026-03-27T12:00:00.000Z').toISOString()
    })

    render(
      <VaultSessionProvider>
        <VaultSessionHarness />
      </VaultSessionProvider>
    )

    await waitFor(() => {
      expect(orpcMocks.refreshTokens).toHaveBeenCalledTimes(2)
    })
    expect(orpcMocks.refresh).not.toHaveBeenCalled()
    expect(orpcMocks.syncSecrets).toHaveBeenCalledTimes(1)
    expect(orpcMocks.markAsSynced).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Linear')).toBeInTheDocument()
    expect(screen.getByTestId('last-sync')).toHaveTextContent(
      '2026-03-27T12:00:00.000Z'
    )
  })

  it('syncs the vault when it returns to the foreground after more than 48 hours', async () => {
    const password = 'super secure password'
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const encryptionSalt = bufferToBase64(salt)
    const masterKey = await generateEncryptionKey(password, salt)
    const deviceSecrets = await initLocalDeviceAuthSecret(masterKey, salt)
    const staleLastSyncAt = new Date('2026-03-25T10:30:00.000Z').toISOString()
    const existingEncryptedSecret = await encryptLoginSecret(
      {
        label: 'GitHub',
        url: 'https://github.com',
        iconUrl: null,
        username: 'capaj',
        password: 'hunter2',
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )
    const syncedEncryptedSecret = await encryptLoginSecret(
      {
        label: 'Linear',
        url: 'https://linear.app',
        iconUrl: null,
        username: 'ops@authier.pm',
        password: 'generated-password',
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )

    window.localStorage.setItem('authier-vault-refresh-token', 'refresh-token-1')
    storeLockedState({
      authSecretEncrypted: deviceSecrets.addDeviceSecretEncrypted,
      encryptionSalt
    })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden'
    })

    orpcMocks.refresh.mockResolvedValueOnce({
      accessToken: 'access-token-2',
      refreshToken: 'refresh-token-2',
      session: createSession({
        lastSyncAt: staleLastSyncAt,
        secrets: [
          {
            id: 'secret-1',
            encrypted: existingEncryptedSecret,
            kind: 'LOGIN_CREDENTIALS',
            version: 1,
            createdAt: new Date('2026-03-25T10:01:00.000Z').toISOString(),
            updatedAt: null
          }
        ]
      })
    })

    const user = userEvent.setup()

    render(
      <VaultSessionProvider>
        <VaultSessionHarness />
      </VaultSessionProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Unlock' }))

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })
    await waitFor(() => {
      expect(screen.getByTestId('last-sync')).toHaveTextContent(staleLastSyncAt)
    })

    orpcMocks.refresh.mockReset()
    orpcMocks.refreshTokens.mockReset()
    orpcMocks.syncSecrets.mockReset()
    orpcMocks.markAsSynced.mockReset()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible'
    })

    orpcMocks.refreshTokens.mockResolvedValueOnce({
      accessToken: 'access-token-3',
      refreshToken: 'refresh-token-3'
    })
    orpcMocks.syncSecrets.mockResolvedValueOnce({
      secrets: [
        createSyncedSecret({
          id: 'secret-2',
          encrypted: syncedEncryptedSecret,
          kind: 'LOGIN_CREDENTIALS',
          version: 1,
          createdAt: new Date('2026-03-27T12:00:00.000Z').toISOString(),
          updatedAt: null
        })
      ]
    })
    orpcMocks.markAsSynced.mockResolvedValueOnce({
      lastSyncAt: new Date().toISOString()
    })

    document.dispatchEvent(new Event('visibilitychange'))

    await waitFor(() => {
      expect(orpcMocks.refreshTokens).toHaveBeenCalledTimes(1)
      expect(orpcMocks.syncSecrets).toHaveBeenCalledTimes(1)
      expect(orpcMocks.markAsSynced).toHaveBeenCalledTimes(1)
    })
    expect(await screen.findByText('Linear')).toBeInTheDocument()
  })

  it('does not sync the vault on foreground events when the current sync is still fresh', async () => {
    const password = 'super secure password'
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const encryptionSalt = bufferToBase64(salt)
    const masterKey = await generateEncryptionKey(password, salt)
    const deviceSecrets = await initLocalDeviceAuthSecret(masterKey, salt)
    const existingEncryptedSecret = await encryptLoginSecret(
      {
        label: 'GitHub',
        url: 'https://github.com',
        iconUrl: null,
        username: 'capaj',
        password: 'hunter2',
        androidUri: null,
        iosUri: null
      },
      masterKey,
      salt
    )

    window.localStorage.setItem('authier-vault-refresh-token', 'refresh-token-1')
    storeLockedState({
      authSecretEncrypted: deviceSecrets.addDeviceSecretEncrypted,
      encryptionSalt
    })

    orpcMocks.refresh.mockResolvedValueOnce({
      accessToken: 'access-token-2',
      refreshToken: 'refresh-token-2',
      session: createSession({
        lastSyncAt: new Date().toISOString(),
        secrets: [
          {
            id: 'secret-1',
            encrypted: existingEncryptedSecret,
            kind: 'LOGIN_CREDENTIALS',
            version: 1,
            createdAt: new Date('2026-03-25T10:01:00.000Z').toISOString(),
            updatedAt: null
          }
        ]
      })
    })

    const user = userEvent.setup()

    render(
      <VaultSessionProvider>
        <VaultSessionHarness />
      </VaultSessionProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Unlock' }))

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })

    orpcMocks.refresh.mockReset()
    orpcMocks.refreshTokens.mockReset()
    orpcMocks.syncSecrets.mockReset()
    orpcMocks.markAsSynced.mockReset()

    window.dispatchEvent(new FocusEvent('focus'))
    document.dispatchEvent(new Event('visibilitychange'))

    expect(orpcMocks.refreshTokens).not.toHaveBeenCalled()
    expect(orpcMocks.syncSecrets).not.toHaveBeenCalled()
    expect(orpcMocks.markAsSynced).not.toHaveBeenCalled()
  })
})
