import { chromium, expect, test } from '@playwright/test'
import { resolve } from 'node:path'
import { createOfflineVaultSnapshot } from '../../ui-preview/scenarios/offlineVault'

for (const failure of ['network', 'server', 'graphql', 'renewal'] as const) {
  test(`cached vault remains usable with a ${failure} failure`, async ({}, testInfo) => {
    const snapshot = await createOfflineVaultSnapshot()
    const context = await chromium.launchPersistentContext(
      testInfo.outputPath('profile'),
      {
        channel: 'chromium',
        headless: true,
        viewport: { width: 1440, height: 980 },
        args: [
          `--disable-extensions-except=${resolve('dist')}`,
          `--load-extension=${resolve('dist')}`
        ]
      }
    )
    const errors: string[] = []
    context.on('weberror', (error) => errors.push(error.error().message))
    let failedRequests = 0
    let renewals = 0
    let backendAvailable = false
    let releaseBackend!: () => void
    const backendReady = new Promise<void>((resolve) => {
      releaseBackend = resolve
    })
    const token = `e30.${btoa(JSON.stringify({ userId: snapshot.userId, exp: Math.floor(Date.now() / 1000) + 3600 }))}.preview`
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.protocol === 'chrome-extension:') return route.continue()
      if (!['/graphql', '/refresh_token'].includes(url.pathname))
        return route.abort()
      const operation = route.request().postDataJSON() as {
        operationName?: string
      } | null
      if (backendAvailable) {
        if (url.pathname === '/refresh_token')
          return route.fulfill({ json: { accessToken: token } })
        const responses: Record<string, unknown> = {
          SyncSettings: {
            me: {
              ...snapshot,
              id: snapshot.userId,
              loginCredentialsLimit: 100,
              TOTPlimit: 100
            },
            currentDevice: { ...snapshot, id: 'preview-device' }
          },
          SyncEncryptedSecrets: {
            currentDevice: { id: 'preview-device', encryptedSecretsToSync: [] }
          },
          WebInputsForHosts: { webInputs: [] },
          markAsSynced: { currentDevice: { markAsSynced: true } }
        }
        return route.fulfill({
          json: { data: responses[operation?.operationName ?? ''] ?? {} }
        })
      }
      if (failure === 'renewal') {
        if (url.pathname === '/refresh_token') {
          return route.fulfill({ status: 401, json: { ok: false } })
        }
        if (operation?.operationName === 'deviceDecryptionChallenge') {
          return route.fulfill({
            json: {
              data: {
                deviceDecryptionChallenge: {
                  __typename: 'DecryptionChallengeApproved',
                  id: 42,
                  addDeviceSecretEncrypted: snapshot.authSecretEncrypted,
                  encryptionSalt: snapshot.encryptionSalt,
                  userId: snapshot.userId,
                  approvedAt: null,
                  deviceId: 'preview-device',
                  deviceName: snapshot.deviceName
                }
              }
            }
          })
        }
        if (operation?.operationName === 'addNewDeviceForUser') {
          renewals += 1
          return route.fulfill({
            json: {
              data: {
                deviceDecryptionChallenge: {
                  __typename: 'DecryptionChallengeApproved',
                  id: 42,
                  addNewDeviceForUser: {
                    accessToken: token,
                    user: {
                      ...snapshot,
                      id: snapshot.userId,
                      EncryptedSecrets: [],
                      device: { ...snapshot, id: 'preview-device' },
                      defaultDeviceSettings: {
                        ...snapshot,
                        id: 'preview-defaults'
                      }
                    }
                  }
                }
              }
            }
          })
        }
      }
      await backendReady
      failedRequests += 1
      if (failure === 'network') return route.abort('internetdisconnected')
      if (failure === 'graphql') {
        return route.fulfill({
          json: { errors: [{ message: 'Database unavailable' }], data: null }
        })
      }
      return route.fulfill({
        status: 503,
        contentType: 'text/plain',
        body: 'Database unavailable'
      })
    })
    try {
      const worker =
        context.serviceWorkers()[0] ??
        (await context.waitForEvent('serviceworker'))
      const extensionId = new URL(worker.url()).hostname
      await worker.evaluate(
        async ({ snapshot, token }) => {
          await chrome.storage.session.set({
            backgroundState: snapshot,
            lockedState: null,
            'access-token': token
          })
        },
        {
          snapshot,
          token: failure === 'renewal' || failure === 'server' ? '' : token
        }
      )
      const page = await context.newPage()
      await page.goto(`chrome-extension://${extensionId}/js/vault.html#/`, {
        waitUntil: 'domcontentloaded'
      })
      const labels = [
        'Example Mail',
        'Example Notes',
        'Work authenticator',
        'Example Passkey'
      ]
      // Local items render even while the backend has not responded at all.
      for (const label of labels)
        await expect(page.getByText(label, { exact: true })).toBeVisible()
      releaseBackend()
      await expect(page.getByRole('status')).toContainText(
        'Your saved items are still available'
      )
      for (const label of labels)
        await expect(page.getByText(label, { exact: true })).toBeVisible()
      await expect(page.getByText('4 secrets', { exact: true })).toBeVisible()
      await expect(page.getByText('No secrets found')).toHaveCount(0)
      expect(failedRequests).toBeGreaterThan(0)
      if (failure === 'renewal') expect(renewals).toBe(1)

      // A retry and local storage update must not empty the visible list.
      await page
        .getByRole('button', { name: 'Synchronize vault', exact: true })
        .click()
      await expect(
        page.getByRole('button', { name: 'Synchronize vault', exact: true })
      ).toBeEnabled()
      for (const label of labels)
        await expect(page.getByText(label, { exact: true })).toBeVisible()

      const search = page.getByPlaceholder(
        'Search vault by url, username, label or password'
      )
      await search.fill('Example Mail')
      await expect(
        page.getByText('Example Notes', { exact: true })
      ).toHaveCount(0)
      await expect(
        page.getByText('Example Mail', { exact: true })
      ).toBeVisible()
      await page
        .getByRole('button', { name: 'Show table view', exact: true })
        .click()
      await page
        .getByRole('button', { name: 'Show secret', exact: true })
        .click()
      await expect(
        page.getByText('mail-preview-password', { exact: true })
      ).toBeVisible()
      await page
        .getByRole('button', { name: 'Hide secret', exact: true })
        .click()
      await search.fill('')

      for (const label of labels)
        await expect(page.getByText(label, { exact: true })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('status')).toContainText(
        'Your saved items are still available'
      )
      for (const label of labels)
        await expect(page.getByText(label, { exact: true })).toBeVisible()
      const stored = await worker.evaluate(() =>
        chrome.storage.session.get('backgroundState')
      )
      expect(stored.backgroundState.secrets).toHaveLength(4)
      expect(stored.backgroundState.decryptedSecrets).toEqual([])
      expect(JSON.stringify(stored)).not.toContain('mail-preview-password')
      expect(errors).toEqual([])
      if (failure === 'server') {
        await page.screenshot({
          path: resolve('../docs/screenshots/offline-vault.png'),
          animations: 'disabled'
        })
      }
      backendAvailable = true
      await page
        .getByRole('button', { name: 'Synchronize vault', exact: true })
        .click()
      await expect(page.getByRole('status')).toHaveCount(0)
      await expect(
        page.getByRole('button', { name: 'Add item', exact: true })
      ).toBeEnabled()
      for (const label of labels)
        await expect(page.getByText(label, { exact: true })).toBeVisible()
    } finally {
      releaseBackend()
      await context.close()
    }
  })
}
