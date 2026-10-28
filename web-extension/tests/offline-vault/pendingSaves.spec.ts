import { chromium, expect, test, type BrowserContext } from '@playwright/test'
import { resolve } from 'node:path'
import { createPendingVaultSnapshot } from '../../ui-preview/scenarios/pendingVault'
import type { SecretSerializedType } from '../../src/background/backgroundPage'

test('durable local save survives browser restart and a lost server acknowledgement', async ({}, testInfo) => {
  const snapshot = await createPendingVaultSnapshot()
  const token = `e30.${btoa(JSON.stringify({ userId: snapshot.userId, exp: Math.floor(Date.now() / 1000) + 3600 }))}.preview`
  const writes: Array<{
    id: string
    operationId: string
    kind: string
    encrypted: string
  }> = []
  const committed = new Map<string, SecretSerializedType>()
  let online = false
  const errors: string[] = []
  const start = async () => {
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
    context.on('weberror', (error) => errors.push(error.error().message))
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.protocol === 'chrome-extension:') return route.continue()
      if (url.pathname === '/api/v1/vault/create') {
        const write = route.request().postDataJSON() as (typeof writes)[number]
        expect(route.request().headers().authorization).toBe(`Bearer ${token}`)
        writes.push(write)
        const saved = {
          id: write.id,
          kind: write.kind,
          encrypted: write.encrypted,
          version: 1,
          createdAt: '2026-10-27T10:01:00.000Z',
          updatedAt: null,
          deletedAt: null
        }
        if (committed.has(write.id))
          expect(committed.get(write.id)).toEqual(saved)
        committed.set(write.id, saved)
        // The server committed, but the browser lost its response.
        if (!online) return route.abort('internetdisconnected')
        return route.fulfill({ json: saved })
      }
      if (url.pathname === '/refresh_token')
        return route.fulfill({ json: { accessToken: token } })
      if (url.pathname !== '/graphql') return route.abort()
      const operation = route.request().postDataJSON() as {
        operationName?: string
      }
      if (!online)
        return route.fulfill({ status: 503, body: 'Offline fixture' })
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
          currentDevice: {
            id: 'preview-device',
            encryptedSecretsToSync: [...snapshot.secrets, ...committed.values()]
          }
        },
        WebInputsForHosts: { webInputs: [] },
        markAsSynced: { currentDevice: { markAsSynced: true } }
      }
      return route.fulfill({
        json: { data: responses[operation.operationName ?? ''] ?? {} }
      })
    })
    return context
  }
  const getWorker = async (context: BrowserContext) =>
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
  let context = await start()
  try {
    let worker = await getWorker(context)
    const extensionId = new URL(worker.url()).hostname
    await worker.evaluate(
      async ({ snapshot, token }) => {
        await chrome.storage.session.set({
          backgroundState: snapshot,
          lockedState: null,
          'access-token': token
        })
      },
      { snapshot, token }
    )
    let page = await context.newPage()
    const vaultUrl = `chrome-extension://${extensionId}/js/vault.html#/`
    await page.goto(vaultUrl)
    await expect(page.getByText('Example Mail', { exact: true })).toBeVisible()
    await expect(
      page.getByText(/1 item needs a newer Authier version/)
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Add item', exact: true })
    ).toBeEnabled()
    await page.getByRole('button', { name: 'Add item', exact: true }).click()
    await page.locator('input[name="url"]').fill('https://new.example.com')
    await page.locator('input[name="label"]').fill('New locally saved login')
    await page.locator('input[name="username"]').fill('alex@example.com')
    await page
      .locator('input[name="password"]')
      .fill('synthetic-one-time-password')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(
      page.getByText('New locally saved login', { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText('Saved on this device — sync pending', { exact: true })
    ).toBeVisible()
    await expect.poll(() => writes.length).toBeGreaterThan(0)
    const stored = await worker.evaluate(() => chrome.storage.local.get(null))
    const entries = Object.entries(stored).filter(([key]) =>
      key.startsWith('pendingSecret:')
    )
    expect(entries).toHaveLength(1)
    expect(JSON.stringify(stored)).not.toContain('synthetic-one-time-password')
    expect(JSON.stringify(stored)).not.toContain(snapshot.masterEncryptionKey)
    expect(stored.lockedState.secrets).toHaveLength(6)
    await expect(
      page.getByText('There was network error.', { exact: true })
    ).toHaveCount(0, { timeout: 12_000 })
    await page.screenshot({
      path: resolve('../docs/screenshots/vaultPendingSync.png'),
      animations: 'disabled'
    })

    // Close the entire browser, not only the vault tab. Local storage and the
    // encrypted remembered vault survive; session storage and live keys do not.
    await context.close()
    context = await start()
    worker = await getWorker(context)
    page = await context.newPage()
    await page.goto(vaultUrl)
    await expect(
      page.getByText('New locally saved login', { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText('Saved on this device — sync pending', { exact: true })
    ).toBeVisible()
    online = true
    await page
      .getByRole('button', { name: 'Synchronize vault', exact: true })
      .click()
    await expect(
      page.getByText('Saved on this device — sync pending', { exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByText('New locally saved login', { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText(/1 item needs a newer Authier version/)
    ).toBeVisible()
    expect(committed.size).toBe(1)
    expect(writes.length).toBeGreaterThan(1)
    for (const write of writes) expect(write).toEqual(writes[0])
    const finalStorage = await worker.evaluate(() =>
      chrome.storage.local.get(null)
    )
    expect(
      Object.keys(finalStorage).filter((key) =>
        key.startsWith('pendingSecret:')
      )
    ).toEqual([])
    expect(finalStorage.lockedState.secrets).toContainEqual(
      snapshot.secrets.at(-1)
    )
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})
