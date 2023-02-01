import { test as base, BrowserContext, chromium } from '@playwright/test'
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

test.describe.configure({ mode: 'parallel' })

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
  await expect(page.getByText(`Authier`)).toBeVisible()
})

test.describe.configure({ mode: 'serial' })

let page: Page

test.beforeAll(async ({ page, extensionId }) => {
  page = page
  await page.goto(`chrome-extension://${extensionId}/vault.html#`)
  await page.getByText(`Don't have account?`).click()
  await page.getByPlaceholder('bob@bob.com').fill(faker.internet.email())
  await page.getByPlaceholder('*******').fill(faker.internet.password())
  await page.getByRole('button', { name: /register/i }).click()
})

const email = faker.internet.email()
const password = faker.internet.password()
test('Register, logout', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/vault.html#`)
  await page.getByText(`Don't have account?`).click()
  await page.getByPlaceholder('bob@bob.com').fill(email)
  await page.getByPlaceholder('*******').fill(password)
  await page.getByRole('button', { name: /register/i }).click()

  await page.getByRole('img').click()
  await page.getByRole('menuitem', { name: 'Logout' }).click()
})

test('Login', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/vault.html#`)
  await page.locator('text=Login').first().isVisible()
  await page.getByPlaceholder('bob@bob.com').fill(email)
  await page.getByPlaceholder('*******').fill(password)
  await page.getByRole('button', { name: /login/i }).click()
  await page.getByPlaceholder('Search vault').isVisible()
  await expect(page.getByText(`Authier`)).toBeVisible()
})
