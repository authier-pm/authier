import { chromium, expect, test } from '@playwright/test'
import { resolve } from 'node:path'
import {
  expectNoProfileKeys,
  profileFilesContainingKeys
} from '../helpers/profileStorage'
import { addPrfAuthenticator } from '../helpers/prfAuthenticator'
import { randomBytes } from 'node:crypto'
import { createOfflineVaultSnapshot } from '../../ui-preview/scenarios/offlineVault'

test('purges historical legacy keys and keeps the live vault key out of the profile', async ({}, testInfo) => {
  const profile = testInfo.outputPath('profile')
  const legacyWrappingKey = randomBytes(32)
  const snapshot = await createOfflineVaultSnapshot()
  const launch = () =>
    chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      headless: true,
      args: [
        `--disable-extensions-except=${resolve('dist')}`,
        `--load-extension=${resolve('dist')}`
      ]
    })
  let context = await launch()
  try {
    await context.route('**/*', (route) => {
      if (route.request().url().startsWith('chrome-extension:'))
        return route.continue()
      return route.fulfill({
        status: 503,
        json: { errors: [{ message: 'Offline test' }] }
      })
    })
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker'))
    await expect
      .poll(() =>
        worker.evaluate(() => chrome.runtime.onConnect.hasListeners())
      )
      .toBe(true)
    const id = new URL(worker.url()).hostname
    // Seed the *old* layout, including its record-only logout. These are random
    // synthetic keys, never a real account or the researcher's fixture.
    await worker.evaluate(
      async ({ bytes, state }) => {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase('authier-device-vault')
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
        const key = await crypto.subtle.importKey(
          'raw',
          new Uint8Array(bytes),
          'AES-GCM',
          false,
          ['encrypt', 'decrypt']
        )
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const ciphertext = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          new TextEncoder().encode(JSON.stringify(state))
        )
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('authier-device-vault', 1)
          request.onupgradeneeded = () =>
            request.result.createObjectStore('snapshots')
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
        for (const record of [
          { generation: 0, key, iv, ciphertext },
          { generation: 1 }
        ]) {
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('snapshots', 'readwrite')
            tx.objectStore('snapshots').put(record, 'vault')
            tx.oncomplete = () => resolve()
            tx.onabort = () => reject(tx.error)
          })
        }
        db.close()
      },
      { bytes: [...legacyWrappingKey], state: snapshot }
    )
    await context.close()
    expect(
      (await profileFilesContainingKeys(profile, [legacyWrappingKey])).length
    ).toBeGreaterThan(0)

    // Start the actual built extension: initialization must purge the backing
    // files before it can use any session keys or accept a new unlock.
    context = await launch()
    await context.route('**/*', (route) => {
      if (route.request().url().startsWith('chrome-extension:'))
        return route.continue()
      return route.fulfill({
        status: 503,
        json: { errors: [{ message: 'Offline test' }] }
      })
    })
    const restartedWorker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker'))
    await expect
      .poll(() =>
        restartedWorker.evaluate(
          async () =>
            (await indexedDB.databases()).find(
              (db) => db.name === 'authier-device-vault'
            )?.version
        )
      )
      .toBe(2)
    await restartedWorker.evaluate(async (state) => {
      await chrome.storage.session.set({
        backgroundState: state,
        lockedState: null
      })
    }, snapshot)
    const page = await context.newPage()
    await page.goto(`chrome-extension://${id}/js/vault.html#/settings/security`)
    await addPrfAuthenticator(context, page)
    await page.getByRole('button', { name: 'Set up passkey unlock' }).click()
    await expect(
      page.getByText('Passkey unlock is enabled on this browser.')
    ).toBeVisible()
    // Exercise the production lock RPC and the production unlock form.
    await page
      .getByRole('button', { name: /Lock/i })
      .filter({ hasText: 'Lock' })
      .first()
      .click()
    await page
      .getByRole('button', { name: 'Unlock with passkey', exact: true })
      .click()
    await expect(page.getByText('Example Mail', { exact: true })).toBeVisible()
  } finally {
    await context.close()
  }
  const sensitive = [
    legacyWrappingKey,
    Buffer.from(snapshot.masterEncryptionKey, 'base64'),
    Buffer.from(snapshot.masterEncryptionKey),
    Buffer.from(snapshot.authSecret)
  ]
  await expectNoProfileKeys(profile, sensitive)
})
