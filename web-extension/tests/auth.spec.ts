import { faker } from '@faker-js/faker'
import { test } from './extensionLoad'
import { expect } from '@playwright/test'

const email = faker.internet.email({
  firstName: 'authier_test_'
})
const password = faker.internet.password()

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ extensionId, page }) => {
  await page.goto(`chrome-extension://${extensionId}/js/vault.html#`)
  await page.waitForSelector('text=Login')
})

test('Register account, logout, login again, remove account', async ({
  page,
  extensionId,
  context
}) => {
  await page.getByText(`Don't have account?`).click()

  await page.fill('#Email', email)

  await page.getByPlaceholder('*******').fill(password)

  await page.getByText('Register').click()

  await expect(page.getByText('Authier', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: email }).click()

  await page.click('text=Logout')

  const newPage = await context.newPage()
  await newPage.goto(`https://www.google.com/`)
  await newPage.goto(`chrome-extension://${extensionId}/js/vault.html#`)

  await newPage.waitForLoadState('domcontentloaded')

  await newPage.getByLabel('Email').fill(email)
  await newPage.getByPlaceholder('*******').fill(password)

  await newPage.getByText('Submit').click()
  await newPage.getByRole('link').filter({ hasText: 'Settings' }).click()

  await newPage.getByRole('button', { name: 'Delete your account' }).click()
  page.on('popup', async (popup) => {
    await popup.waitForLoadState()
  })
  await expect(newPage.getByText('Delete Customer')).toBeVisible()
  await newPage.getByRole('button', { name: 'Delete' }).click()
})
