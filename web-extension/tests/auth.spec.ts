import { faker } from '@faker-js/faker'
import { test, expect } from './extensionLoad'

import { BrowserContext, Page } from '@playwright/test'

const email = faker.internet.email({
  firstName: 'authier_test_'
})
const password = faker.internet.password()

test.describe.serial('Account management process', () => {
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
    await expect(
      logoutPage.getByRole('heading', { name: 'Login' })
    ).toBeVisible()

    await logoutPage.getByLabel('Email').fill(email)
    await logoutPage.getByPlaceholder('*******').fill(password)

    await logoutPage.getByText('Submit').click()
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

    await page.getByRole('button', { name: email }).click()
    await expect(
      page.getByRole('menuitem', { name: 'Lock device' })
    ).toBeVisible()
    await page.click('text=Logout')
  })

  test('Relogin account', async () => {
    //We need to create page from the one context
    const reloginPage = await context.newPage()
    await reloginPage.goto(`https://www.google.com/`)
    await reloginPage.goto(`chrome-extension://${extensionId}/js/vault.html#`)
    await reloginPage.waitForLoadState('domcontentloaded')
    await expect(
      reloginPage.getByRole('heading', { name: 'Login' })
    ).toBeVisible()

    await reloginPage.getByLabel('Email').fill(email)
    await reloginPage.getByPlaceholder('*******').fill(password)

    await reloginPage.getByText('Submit').click()
    await expect(
      reloginPage.getByText('Authier', { exact: true })
    ).toBeVisible()

    await reloginPage.getByRole('button', { name: email }).click()
    await expect(
      reloginPage.getByRole('menuitem', { name: 'Lock device' })
    ).toBeVisible()
    await reloginPage.click('text=Logout')
  })
})
