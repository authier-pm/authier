import { faker } from '@faker-js/faker'
import { test, expect } from './extensionLoad'

import { BrowserContext, Page } from '@playwright/test'

const email = faker.internet.email({
  firstName: 'authier_test_'
})
const password = faker.internet.password()

const secretLabel = faker.internet.domainName()
const secretUsername = faker.internet.userName()
const secretPassword = faker.internet.password()

test.describe.serial('Secrets management', () => {
  let page: Page
  let extensionId: string
  let context: BrowserContext

  test.beforeAll(
    async ({
      page: testPage,
      extensionId: testExtensionId,
      context: testContext
    }) => {
      page = testPage
      extensionId = testExtensionId
      context = testContext
    }
  )

  //Remove account after all tests
  test.afterAll(async () => {
    const logoutPage = await context.newPage()
    await logoutPage.goto(`https://www.google.com/`)
    await logoutPage.goto(`chrome-extension://${extensionId}/js/vault.html#`)
    await logoutPage.waitForLoadState('domcontentloaded')

    await expect(logoutPage.getByText('Authier', { exact: true })).toBeVisible()

    await logoutPage.getByRole('link').filter({ hasText: 'Settings' }).click()

    await logoutPage
      .getByRole('button', { name: 'Delete your account' })
      .click()
    logoutPage.on('popup', async (popup) => {
      await popup.waitForLoadState()
    })
    await expect(logoutPage.getByText('Delete Customer')).toBeVisible()
    await logoutPage.getByRole('button', { name: 'Delete' }).click()
  })

  test('Register account', async () => {
    await page.goto(`chrome-extension://${extensionId}/js/vault.html#`)
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()

    await page.getByText(`Don't have account?`).click()
    await expect(
      page.getByRole('heading', { name: 'Create account' })
    ).toBeVisible()

    await page.fill('#Email', email)
    await page.getByPlaceholder('*******').fill(password)
    await page.getByText('Register').click()

    await expect(page.getByText('Authier', { exact: true })).toBeVisible()
    await expect(page.getByText('0 secrets')).toBeVisible()
  })

  test('Create secret', async () => {
    await expect(page.getByText('0 secrets')).toBeVisible()
    await page.getByRole('button', { name: 'Add item' }).click()
    await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible()

    await page
      .getByPlaceholder('google.com')
      .fill('https://websecurity.dev/password-managers/login/')
    await page.getByPlaceholder('Work email').fill(secretLabel)
    await page.getByLabel('Username:').fill(secretUsername)
    await page.getByLabel('Password:').fill(secretPassword)

    await page.getByText('Save').click()

    await expect(page.getByText('1 secrets')).toBeVisible()
  })

  test('Autofill secret', async () => {
    await expect(page.getByText(secretLabel)).toBeVisible()

    // Start waiting for new page before clicking. Note no await.
    const pagePromise = context.waitForEvent('page')
    await page.getByRole('grid', { name: 'grid' }).getByRole('img').hover()
    await page.getByRole('button', { name: 'open item' }).click()
    const newPage = await pagePromise
    await newPage.waitForLoadState()

    await expect(
      newPage.getByRole('heading', { name: 'Please save the password' })
    ).toBeVisible()
    await newPage.close()
  })

  test('Delete secret', async () => {
    await expect(page.getByText('1 secrets')).toBeVisible()

    await page
      .getByRole('grid', { name: 'grid' })
      .getByRole('img')
      .nth(1)
      .click()
    page.on('popup', async (popup) => {
      await popup.waitForLoadState()
    })
    await expect(page.getByText('Delete confirmation')).toBeVisible()
    await page.getByRole('button', { name: 'Yes' }).click()

    await expect(page.getByText('0 secrets')).toBeVisible()
    await page.getByRole('button', { name: 'menu' }).first().click()
    await expect(page.getByText('0 secrets')).toBeVisible()
  })
})
