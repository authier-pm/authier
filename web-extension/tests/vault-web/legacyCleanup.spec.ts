import { chromium, expect, test } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { expectNoProfileKeys } from '../helpers/profileStorage'

test('the deployed vault Worker purges historical keys before showing the vault', async ({}, testInfo) => {
  const profile = testInfo.outputPath('profile')
  const wrappingKey = randomBytes(32)
  const browser = await chromium.launchPersistentContext(profile, {
    headless: true
  })
  try {
    const page = await browser.newPage()
    await page.goto('http://127.0.0.1:4187')
    await expect
      .poll(() =>
        page.evaluate(
          async () =>
            (await indexedDB.databases()).find(
              (db) => db.name === 'authier-device-vault'
            )?.version
        )
      )
      .toBe(2)
    await page.evaluate(
      async (bytes) => {
        localStorage.setItem('authier-vault-device-id', 'synthetic-device-id')
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
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('authier-device-vault', 1)
          request.onupgradeneeded = () =>
            request.result.createObjectStore('snapshots')
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('snapshots', 'readwrite')
          tx.objectStore('snapshots').put({ key }, 'vault')
          tx.oncomplete = () => resolve()
          tx.onabort = () => reject(tx.error)
        })
        db.close()
      },
      [...wrappingKey]
    )
    const cleared = page.waitForResponse((response) =>
      response.url().endsWith('/clear-legacy-vault')
    )
    await page.reload()
    expect((await cleared).status()).toBe(204)
    await expect
      .poll(() =>
        page.evaluate(
          async () =>
            (await indexedDB.databases()).find(
              (db) => db.name === 'authier-device-vault'
            )?.version
        )
      )
      .toBe(2)
    expect(
      await page.evaluate(() => localStorage.getItem('authier-vault-device-id'))
    ).toBe('synthetic-device-id')
    await expect(
      page.getByText('Finish the vault security update')
    ).toHaveCount(0)
  } finally {
    await browser.close()
  }
  await expectNoProfileKeys(profile, [wrappingKey])
})
