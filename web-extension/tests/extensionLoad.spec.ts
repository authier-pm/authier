import { test as base, BrowserContext, chromium, Page } from '@playwright/test'
import { faker } from '@faker-js/faker'
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

test('Login page is visible', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/vault.html#`)
  await page.locator('text=Login').first().isVisible()
})

test('Register page is visible', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/vault.html#`)
  await page.getByText(`Don't have account?`).click()
  await page.locator('text=Register').first().isVisible()
})

test('Register account', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/vault.html#`)
  await page.getByText(`Don't have account?`).click()
  await page.getByPlaceholder('bob@bob.com').fill(faker.internet.email())
  await page.getByPlaceholder('*******').fill(faker.internet.password())
  await page.getByRole('button', { name: /register/i }).click()

  await page.getByPlaceholder('Search vault').isVisible()
  await page.getByText(`Authier`).isVisible()
})

test('Add login credential, TOTP', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/vault.html#`)
  await page.getByText(`Don't have account?`).click()
  await page.getByPlaceholder('bob@bob.com').fill(faker.internet.email())
  await page.getByPlaceholder('*******').fill(faker.internet.password())
  await page.getByRole('button', { name: /register/i }).click()

  await page.getByPlaceholder('Search vault').isVisible()
  await page.getByRole('button', { name: 'Add item' }).click()

  await page.getByRole('combobox').selectOption('Login')
  await page.getByLabel('url').fill(faker.internet.url())
  await page.getByLabel('label').fill('secret')
  await page.getByLabel('username').fill('secret')
  await page.getByLabel('password').fill('secret')

  await page.getByRole('button', { name: /create/i }).click()
  await page.getByText(`Authier`).isVisible()
  await page.getByText('secret').isVisible()

  await page.getByRole('button', { name: 'Add item' }).click()
  await page.getByRole('combobox').selectOption('TOTP')
  await page.getByLabel('url').fill(faker.internet.url())
  await page.getByLabel('label').fill('totp')
  await page.getByLabel('secret').fill('JBSWY3DPEHPK3PXP')
  await page.getByRole('button', { name: /create/i }).click()
  await page.getByText(`Authier`).isVisible()
  await page.getByText('totp').isVisible()
})
