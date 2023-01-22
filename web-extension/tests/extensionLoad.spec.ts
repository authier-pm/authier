import { test as base, BrowserContext, chromium } from '@playwright/test'
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

export const expect = test.expect

test('Register, logout', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/vault.html#`)
  await page.getByRole('link', { name: "Don't have account?" }).click()
  await page.getByRole('heading', { name: 'Create account' }).isVisible()

  //TODO: Generate random account
  await page.getByPlaceholder('bob@bob.com').fill('bob@bob.com')
  await page.getByPlaceholder('*******').fill('bob')
  await page.getByRole('button', { name: 'Register' }).click()

  await page.getByPlaceholder('Search vault').isVisible()
  await page.getByText('Admin').click()
  await page.getByRole('button', { name: 'Logout' }).click()
})
