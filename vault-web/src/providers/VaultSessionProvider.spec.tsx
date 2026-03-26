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
import { setAccessToken } from '@/lib/accessToken'
import { encryptLoginSecret } from '@/lib/vaultSecrets'
import { VaultSessionProvider, useVaultSession } from './VaultSessionProvider'

const orpcMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
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
      register: orpcMocks.register,
      requestDeviceChallenge: orpcMocks.requestDeviceChallenge,
      completeDeviceLogin: orpcMocks.completeDeviceLogin,
      initiateMasterDeviceReset: orpcMocks.initiateMasterDeviceReset,
      logout: orpcMocks.logout
    },
    vault: {
      createSecret: orpcMocks.createSecret,
      updateSecret: orpcMocks.updateSecret,
      deleteSecret: orpcMocks.deleteSecret
    }
  }
}))

function VaultSessionHarness() {
  const {
    createLoginSecret,
    decryptedSecrets,
    deleteSecret,
    status,
    unlockVault,
    updateLoginSecret
  } = useVaultSession()

  return (
    <div>
      <p data-testid="status">{status}</p>
      <button onClick={() => void unlockVault('super secure password')} type="button">
        Unlock
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
    window.localStorage.clear()
    setAccessToken(null)
    orpcMocks.refresh.mockReset()
    orpcMocks.register.mockReset()
    orpcMocks.requestDeviceChallenge.mockReset()
    orpcMocks.completeDeviceLogin.mockReset()
    orpcMocks.initiateMasterDeviceReset.mockReset()
    orpcMocks.logout.mockReset()
    orpcMocks.createSecret.mockReset()
    orpcMocks.updateSecret.mockReset()
    orpcMocks.deleteSecret.mockReset()
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
          lastSyncAt: null,
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
        lastSyncAt: null,
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

    orpcMocks.refresh.mockResolvedValue({
      accessToken: 'access-token-2',
      refreshToken: 'refresh-token-2',
      session
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
    expect(orpcMocks.refresh).toHaveBeenCalledWith({
      refreshToken: 'refresh-token-1'
    })
  })
})
