// import { faker } from '@faker-js/faker'
// import { test } from './extensionLoad'
// import { expect } from '@playwright/test'

// const email = faker.internet.email({
//   firstName: 'authier_test_'
// })
// const password = faker.internet.password()

// test.describe.configure({ mode: 'serial' })

// test('Register account, logout, login again, remove account', async ({
//   page,
//   extensionId,
//   context
// }) => {
//   await page.getByText(`Don't have account?`).click()

//   await page.fill('#Email', email)

//   await page.getByPlaceholder('*******').fill(password)

//   await page.getByText('Register').click()

//   await expect(page.getByText('Authier', { exact: true })).toBeVisible()

//   await page.getByRole('button', { name: email }).click()

//   await page.click('text=Logout')

//   const newPage = await context.newPage()
//   await newPage.goto(`https://www.google.com/`)
//   await newPage.goto(`chrome-extension://${extensionId}/js/vault.html#`)

//   await newPage.waitForLoadState('domcontentloaded')

//   await newPage.getByLabel('Email').fill(email)
//   await newPage.getByPlaceholder('*******').fill(password)

//   await newPage.getByText('Submit').click()
//   await newPage.getByRole('link').filter({ hasText: 'Settings' }).click()

//   await newPage.getByRole('button', { name: 'Delete your account' }).click()
//   page.on('popup', async (popup) => {
//     await popup.waitForLoadState()
//   })
//   await expect(newPage.getByText('Delete Customer')).toBeVisible()
//   await newPage.getByRole('button', { name: 'Delete' }).click()
// })

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
  let reloginPage: Page

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

  test('Logout account', async () => {
    await page.getByRole('button', { name: email }).click()
    await expect(
      page.getByRole('menuitem', { name: 'Lock device' })
    ).toBeVisible()
    await page.click('text=Logout')
  })

  test('Relogin account', async () => {
    reloginPage = await context.newPage()
    await reloginPage.goto(`chrome-extension://${extensionId}/js/vault.html#`)
    await reloginPage.waitForLoadState('domcontentloaded')

    await reloginPage.getByLabel('Email').fill(email)
    await reloginPage.getByPlaceholder('*******').fill(password)

    await reloginPage.getByText('Submit').click()
    await expect(
      reloginPage.getByText('Authier', { exact: true })
    ).toBeVisible()
  })

  test('Remove account', async () => {
    await reloginPage.getByRole('link').filter({ hasText: 'Settings' }).click()

    await reloginPage
      .getByRole('button', { name: 'Delete your account' })
      .click()
    reloginPage.on('popup', async (popup) => {
      await popup.waitForLoadState()
    })
    await expect(reloginPage.getByText('Delete Customer')).toBeVisible()
    await reloginPage.getByRole('button', { name: 'Delete' }).click()
  })
})
