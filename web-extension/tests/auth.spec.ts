import { faker } from '@faker-js/faker'
import { test } from './extensionLoad'

test.describe('Authenticating', () => {
  const email = faker.internet.email()
  const password = faker.internet.password()

  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/js/vault.html#`)
  })

  test('Register account and logout', async ({ page }) => {
    await page.getByText(`Don't have account?`).click()

    await page.fill('#Email', email)
    await page.waitForSelector('input[name="password"]')

    await page.getByPlaceholder('*******').fill(password)

    await page.getByText('Register').click()

    await page.getByRole('paragraph', { name: 'Authier' }).isVisible()

    await page.getByRole('button', { name: email }).click()
    await page.click('text=Logout')
  })

  test('Login into existing account', async ({ page }) => {
    await page.getByLabel('Email').fill(email)
    await page.getByPlaceholder('*******').fill(password)

    await page.getByText('Login').click()
    await page.getByRole('paragraph', { name: 'Authier' }).isVisible()
  })
})
