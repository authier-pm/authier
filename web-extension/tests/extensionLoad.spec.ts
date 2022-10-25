import {
  test as base,
  expect,
  BrowserContext,
  chromium
} from '@playwright/test'
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
    // for manifest v2:
    let [background] = context.backgroundPages()
    if (!background) background = await context.waitForEvent('backgroundpage')

    const extensionId = background.url().split('/')[2]
    await use(extensionId)
  }
})

test('Login page is visible', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/vault.html#`)
  await page.locator('text=Login').first().isVisible()
})
