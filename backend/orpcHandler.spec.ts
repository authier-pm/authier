import { describe, expect, it, afterEach } from 'vitest'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import { buildApp } from './app'
import { truncateAllTables } from './tests/truncateAllTables'
import {
  base64ToBuffer,
  bufferToBase64,
  decryptString,
  generateEncryptionKey,
  initLocalDeviceAuthSecret
} from '@shared/cryptoUtils'
import { vaultApiContract } from '@shared/orpc/contract'

type VaultClient = ContractRouterClient<typeof vaultApiContract>
type AuthState = {
  accessToken: string | null
}
type DeviceIdentity = {
  id: string
  name: string
  platform: string
}

type RegisteredBrowser = {
  authState: AuthState
  client: VaultClient
  email: string
  password: string
  device: DeviceIdentity
  session: Awaited<ReturnType<VaultClient['auth']['register']>>
}

const createAuthState = (): AuthState => ({
  accessToken: null
})

const createVaultClient = (
  app: ReturnType<typeof buildApp>,
  authState: AuthState
): VaultClient => {
  const link = new RPCLink({
    url: 'http://authier.test/rpc',
    headers: () => {
      const headers: Record<string, string> = {
        'x-forwarded-for': '127.0.0.1'
      }

      if (authState.accessToken) {
        headers.authorization = `Bearer ${authState.accessToken}`
      }

      return headers
    },
    fetch: (request) => app.handle(request)
  })

  return createORPCClient(link)
}

const registerBrowser = async (
  app: ReturnType<typeof buildApp>,
  email: string,
  password: string,
  device: DeviceIdentity
): Promise<RegisteredBrowser> => {
  const authState = createAuthState()
  const client = createVaultClient(app, authState)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encryptionSalt = bufferToBase64(salt)
  const masterKey = await generateEncryptionKey(password, salt)
  const deviceSecrets = await initLocalDeviceAuthSecret(masterKey, salt)

  const session = await client.auth.register({
    userId: crypto.randomUUID(),
    deviceId: device.id,
    deviceName: device.name,
    email,
    input: {
      ...deviceSecrets,
      encryptionSalt,
      firebaseToken: null,
      devicePlatform: device.platform
    }
  })

  authState.accessToken = session.accessToken

  return {
    authState,
    client,
    email,
    password,
    device,
    session
  }
}

afterEach(async () => {
  await truncateAllTables()
})

describe('oRPC handler', () => {
  it('responds to vault web CORS preflight requests', async () => {
    const app = buildApp()
    const response = await app.handle(
      new Request('http://authier.test/rpc/auth/refresh', {
        method: 'OPTIONS',
        headers: {
          origin: 'https://vault.authier.pm',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type,authorization'
        }
      })
    )

    expect(response.status).toBeLessThan(300)
    expect(response.headers.get('access-control-allow-origin')).toBe(
      'https://vault.authier.pm'
    )
    expect(response.headers.get('access-control-allow-headers')).toContain(
      'Authorization'
    )
  })

  it('registers, refreshes, authenticates with bearer tokens, and manages vault state', async () => {
    const app = buildApp()
    const masterBrowser = await registerBrowser(
      app,
      `vault-${crypto.randomUUID()}@test.com`,
      'correct horse battery staple',
      {
        id: crypto.randomUUID(),
        name: 'Primary browser',
        platform: 'web'
      }
    )
    const guestClient = createVaultClient(app, createAuthState())

    await expect(guestClient.session.bootstrap({})).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
      message: 'not authenticated'
    })
    await expect(
      guestClient.auth.refresh({
        refreshToken: ''
      })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      status: 400
    })

    const bootstrap = await masterBrowser.client.session.bootstrap({})

    expect(bootstrap.user.email).toBe(masterBrowser.email)
    expect(bootstrap.currentDevice.id).toBe(masterBrowser.device.id)
    expect(bootstrap.pendingChallenges).toHaveLength(0)
    expect(masterBrowser.session.session.currentDevice.lastSyncAt).toBeNull()
    expect(bootstrap.currentDevice.lastSyncAt).toBeNull()

    const createdSecret = await masterBrowser.client.vault.createSecret({
      kind: 'LOGIN_CREDENTIALS',
      encrypted: 'ciphertext-v1'
    })
    const listedSecrets = await masterBrowser.client.vault.listSecrets({})
    const initialSyncSecrets = await masterBrowser.client.session.syncSecrets(
      {}
    )

    expect(listedSecrets.secrets).toHaveLength(1)
    expect(listedSecrets.secrets[0]?.id).toBe(createdSecret.id)
    expect(initialSyncSecrets.secrets).toHaveLength(1)
    expect(initialSyncSecrets.secrets[0]?.id).toBe(createdSecret.id)

    await masterBrowser.client.session.markAsSynced({})

    expect(await masterBrowser.client.session.syncSecrets({})).toMatchObject({
      secrets: []
    })

    const updatedSecret = await masterBrowser.client.vault.updateSecret({
      id: createdSecret.id,
      patch: {
        kind: 'LOGIN_CREDENTIALS',
        encrypted: 'ciphertext-v2'
      }
    })

    expect(updatedSecret.encrypted).toBe('ciphertext-v2')
    expect(updatedSecret.version).toBe(createdSecret.version + 1)
    expect(await masterBrowser.client.session.syncSecrets({})).toMatchObject({
      secrets: [
        expect.objectContaining({
          id: createdSecret.id,
          deletedAt: null,
          encrypted: 'ciphertext-v2'
        })
      ]
    })

    await masterBrowser.client.session.markAsSynced({})

    const updatedPolicy =
      await masterBrowser.client.security.updateNewDevicePolicy({
        newDevicePolicy: 'REQUIRE_MASTER_DEVICE_APPROVAL'
      })

    expect(updatedPolicy.security.newDevicePolicy).toBe(
      'REQUIRE_MASTER_DEVICE_APPROVAL'
    )

    const updatedCooldown =
      await masterBrowser.client.security.updateRecoveryCooldown({
        deviceRecoveryCooldownMinutes: 90
      })

    expect(updatedCooldown.security.deviceRecoveryCooldownMinutes).toBe(90)

    const updatedTimeout =
      await masterBrowser.client.security.updateVaultLockTimeout({
        vaultLockTimeoutSeconds: 600
      })

    expect(updatedTimeout.security.vaultLockTimeoutSeconds).toBe(600)

    await masterBrowser.client.vault.deleteSecret({
      id: createdSecret.id
    })

    expect(await masterBrowser.client.vault.listSecrets({})).toMatchObject({
      secrets: []
    })
    expect(await masterBrowser.client.session.syncSecrets({})).toMatchObject({
      secrets: [
        expect.objectContaining({
          id: createdSecret.id,
          deletedAt: expect.any(String)
        })
      ]
    })

    const refreshedSession = await masterBrowser.client.auth.refresh({
      refreshToken: masterBrowser.session.refreshToken
    })
    const refreshedTokens = await masterBrowser.client.auth.refreshTokens({
      refreshToken: refreshedSession.refreshToken
    })

    expect(refreshedSession.accessToken).not.toBe(
      masterBrowser.session.accessToken
    )
    expect(refreshedSession.refreshToken).not.toBe(
      masterBrowser.session.refreshToken
    )
    expect(refreshedSession.session.currentDevice.lastSyncAt).toEqual(
      expect.any(String)
    )
    expect(refreshedTokens.accessToken).toEqual(expect.any(String))
    expect(refreshedTokens.refreshToken).toEqual(expect.any(String))

    masterBrowser.authState.accessToken = refreshedSession.accessToken

    const syncedDevice = await masterBrowser.client.session.markAsSynced({})
    const refreshedBootstrap = await masterBrowser.client.session.bootstrap({})

    expect(syncedDevice.lastSyncAt).toEqual(expect.any(String))
    expect(refreshedBootstrap.currentDevice.lastSyncAt).toBe(
      syncedDevice.lastSyncAt
    )
    expect(refreshedBootstrap.currentDevice.vaultLockTimeoutSeconds).toBe(600)
    expect(refreshedBootstrap.user.deviceRecoveryCooldownMinutes).toBe(90)
  })

  it('creates pending device challenges, approves or rejects them, and completes approved logins', async () => {
    const app = buildApp()
    const masterBrowser = await registerBrowser(
      app,
      `devices-${crypto.randomUUID()}@test.com`,
      'correct horse battery staple',
      {
        id: crypto.randomUUID(),
        name: 'Master browser',
        platform: 'web'
      }
    )

    await masterBrowser.client.security.updateNewDevicePolicy({
      newDevicePolicy: 'REQUIRE_MASTER_DEVICE_APPROVAL'
    })

    const secondaryState = createAuthState()
    const secondaryClient = createVaultClient(app, secondaryState)
    const secondaryDevice = {
      id: crypto.randomUUID(),
      name: 'Travel browser',
      platform: 'web'
    } satisfies DeviceIdentity

    const pendingChallenge = await secondaryClient.auth.requestDeviceChallenge({
      email: masterBrowser.email,
      deviceInput: secondaryDevice
    })

    expect(pendingChallenge.status).toBe('pending')

    const pendingChallenges =
      await masterBrowser.client.devices.listPendingChallenges({})
    const pendingRecord = pendingChallenges.challenges.find(
      (challenge) => challenge.id === pendingChallenge.challengeId
    )

    expect(pendingRecord?.deviceName).toBe(secondaryDevice.name)

    await masterBrowser.client.devices.approveChallenge({
      id: pendingChallenge.challengeId
    })

    const approvedChallenge = await secondaryClient.auth.requestDeviceChallenge(
      {
        email: masterBrowser.email,
        deviceInput: secondaryDevice
      }
    )

    expect(approvedChallenge.status).toBe('approved')
    if (approvedChallenge.status !== 'approved') {
      throw new Error('Expected approved challenge')
    }

    const masterEncryptionKey = await generateEncryptionKey(
      masterBrowser.password,
      base64ToBuffer(approvedChallenge.encryptionSalt)
    )
    const currentAddDeviceSecret = await decryptString(
      masterEncryptionKey,
      approvedChallenge.addDeviceSecretEncrypted
    )
    const nextSalt = crypto.getRandomValues(new Uint8Array(16))
    const nextDeviceSecrets = await initLocalDeviceAuthSecret(
      masterEncryptionKey,
      nextSalt
    )
    const completedLogin = await secondaryClient.auth.completeDeviceLogin({
      challengeId: approvedChallenge.challengeId,
      currentAddDeviceSecret,
      input: {
        ...nextDeviceSecrets,
        encryptionSalt: bufferToBase64(nextSalt),
        firebaseToken: null,
        devicePlatform: secondaryDevice.platform
      }
    })

    secondaryState.accessToken = completedLogin.accessToken

    const secondaryBootstrap = await secondaryClient.session.bootstrap({})

    expect(secondaryBootstrap.currentDevice.id).toBe(secondaryDevice.id)

    const devices = await masterBrowser.client.devices.list({})

    expect(devices.devices.map((device) => device.id)).toContain(
      secondaryDevice.id
    )

    const rejectedState = createAuthState()
    const rejectedClient = createVaultClient(app, rejectedState)
    const rejectedDevice = {
      id: crypto.randomUUID(),
      name: 'Rejected browser',
      platform: 'web'
    } satisfies DeviceIdentity
    const rejectedChallenge = await rejectedClient.auth.requestDeviceChallenge({
      email: masterBrowser.email,
      deviceInput: rejectedDevice
    })

    expect(rejectedChallenge.status).toBe('pending')

    await masterBrowser.client.devices.rejectChallenge({
      id: rejectedChallenge.challengeId
    })

    expect(
      await rejectedClient.auth.requestDeviceChallenge({
        email: masterBrowser.email,
        deviceInput: rejectedDevice
      })
    ).toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Login failed, try again later.'
    })
  })
})
