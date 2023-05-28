import { test as base, BrowserContext, chromium, Page } from '@playwright/test'
import path from 'path'

export const test = base.extend<{
  context: BrowserContext
  extensionId: string
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../dist')
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ]
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    // for manifest v3:
    let [background] = context.serviceWorkers()
    if (!background) background = await context.waitForEvent('serviceworker')

    const extensionId = background.url().split('/')[2]
    await use(extensionId)
  }
})

export const expect = test.expect

test.describe('Extension load', () => {
  test('Popup is visible and can open vault', async ({
    context,
    page,
    extensionId
  }) => {
    await page.goto(`chrome-extension://${extensionId}/js/popup.html#`)
    await expect(page.locator('body')).toHaveText(
      'Open vault to login or sign up'
    )

    const newPagePromise: Promise<Page> = new Promise((resolve) =>
      context.once('page', resolve)
    )
    await page.getByRole('button').click()
    const newPage: Page = await newPagePromise

    await expect(newPage.locator('h3')).toContainText('Login')
  })
})
