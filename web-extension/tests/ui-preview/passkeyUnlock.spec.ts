import { chromium, expect, test, type BrowserContext } from '@playwright/test'
import { cp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expectNoProfileKeys } from '../helpers/profileStorage'
import { addPrfAuthenticator } from '../helpers/prfAuthenticator'

test('passkey unlock survives a reload; copying the logged-in profile does not copy the authenticator key', async ({}, testInfo) => {
  const profile = testInfo.outputPath('profile')
  const copy = testInfo.outputPath('stolen-profile')
  const keys: string[] = []
  const context = await chromium.launchPersistentContext(profile, {
    headless: true,
    viewport: { width: 640, height: 720 }
  })
  let copied: BrowserContext | undefined
  try {
    await context.exposeFunction('reportPreviewKey', (key: string) => {
      keys.push(key)
    })
    await context.addInitScript(() => {
      window.addEventListener('preview-vault-key', (event) => {
        const report = (
          window as unknown as { reportPreviewKey: (key: string) => void }
        ).reportPreviewKey
        report((event as CustomEvent<string>).detail)
      })
    })
    const page = await context.newPage()
    await addPrfAuthenticator(context, page)
    await page.goto('http://localhost:4174/?scenario=passkey-unlock')
    await page.getByRole('button', { name: 'Set up passkey unlock' }).click()
    await expect(
      page.getByText('Passkey unlock is enabled on this browser.')
    ).toBeVisible()
    await page.goto('http://localhost:4174/?scenario=passkey-unlock&locked=1')
    await page.screenshot({
      path: resolve('../docs/screenshots/passkeyUnlock.png')
    })
    await page
      .getByRole('button', { name: 'Unlock with passkey', exact: true })
      .click()
    await expect(
      page.getByText('Vault unlocked', { exact: true })
    ).toBeVisible()
    expect(keys).toHaveLength(2)
    expect(keys[1]).toBe(keys[0])

    // Copy actual on-disk data while the original browser remains unlocked.
    // The OS/security-key authenticator is deliberately not copied.
    await cp(profile, copy, {
      recursive: true,
      filter: (source) => !source.split('/').at(-1)?.startsWith('Singleton')
    })
    await expectNoProfileKeys(copy, [Buffer.from(keys[0], 'base64')])
    copied = await chromium.launchPersistentContext(copy, { headless: true })
    const stolenPage = await copied.newPage()
    await addPrfAuthenticator(copied, stolenPage)
    await stolenPage.goto(
      'http://localhost:4174/?scenario=passkey-unlock&locked=1'
    )
    await stolenPage.evaluate(() => {
      const nativeGet = navigator.credentials.get.bind(navigator.credentials)
      navigator.credentials.get = (options) =>
        nativeGet({ ...options, signal: AbortSignal.timeout(500) })
    })
    await stolenPage
      .getByRole('button', { name: 'Unlock with passkey', exact: true })
      .click()
    await expect(stolenPage.getByRole('alert')).toBeVisible()
    await expect(
      stolenPage.getByText('Vault unlocked', { exact: true })
    ).toHaveCount(0)
    await expect(stolenPage.locator('input[type="password"]')).toBeVisible()
    await page.getByRole('button', { name: 'Log out', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Unlock with passkey', exact: true })
    ).toHaveCount(0)
  } finally {
    await copied?.close()
    await context.close()
  }
  await expectNoProfileKeys(profile, [Buffer.from(keys[0], 'base64')])
})

test('unsupported authenticators do not enable an insecure fallback', async ({
  context,
  page
}) => {
  await addPrfAuthenticator(context, page, false)
  await page.goto('http://localhost:4174/?scenario=passkey-unlock')
  await page.getByRole('button', { name: 'Set up passkey unlock' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'does not support vault unlock'
  )
  await expect(
    page.getByText('Passkey unlock is enabled on this browser.')
  ).toHaveCount(0)
})
