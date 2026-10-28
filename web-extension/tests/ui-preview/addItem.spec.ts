import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://www.gravatar.com/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      path: 'ui-preview/fixtures/exampleFavicon.svg'
    })
  )
})

async function fillLogin(page: Page) {
  await page
    .getByRole('textbox', { name: 'Label Optional', exact: true })
    .fill('Work Google account')
  await page
    .getByRole('textbox', { name: 'Website' })
    .fill('accounts.google.com')
  await page
    .getByRole('textbox', { name: 'Username or email' })
    .fill('alex@example.com')
}

test('generates passwords in place and only saves on explicit submission', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1040 })
  await page.goto('/?scenario=add-item')
  await fillLogin(page)
  const navigations: string[] = []
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations.push(frame.url())
  })
  const password = page.locator('input[name="password"]')
  const label = page.getByRole('textbox', {
    name: 'Label Optional',
    exact: true
  })
  await expect(label).toBeEditable()
  await label.fill('My work Google login')
  const original = await password.inputValue()
  await page.getByRole('spinbutton', { name: 'Length', exact: true }).fill('24')
  await page
    .getByRole('button', { name: 'Generate password', exact: true })
    .click()
  await expect(password).not.toHaveValue(original)
  await expect(label).toHaveValue('My work Google login')
  expect(await password.inputValue()).toHaveLength(24)
  await expect(page.getByRole('textbox', { name: 'Website' })).toHaveValue(
    'accounts.google.com'
  )
  await expect(
    page.getByRole('textbox', { name: 'Username or email' })
  ).toHaveValue('alex@example.com')
  await expect(page.locator('form')).toHaveCount(1)
  await page.getByRole('button', { name: 'Show password' }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Hide password' }).click()
  await expect(password).toHaveAttribute('type', 'password')
  const generated = await password.inputValue()
  await page
    .getByRole('spinbutton', { name: 'Length', exact: true })
    .press('Enter')
  await expect(password).not.toHaveValue(generated)
  await label.fill('Work Google account — primary')
  expect(navigations).toEqual([])
  await expect(
    page.getByRole('heading', { name: 'New vault item' })
  ).toBeVisible()
  await page.getByRole('textbox', { name: 'Website' }).focus()
  await page.getByRole('textbox', { name: 'Website' }).blur()
  await page.screenshot({ path: '../docs/screenshots/add-item-desktop.png' })
  const savedPassword = await password.inputValue()
  await page.getByRole('button', { name: 'Save login', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('1 item saved')
  await expect(page.getByTestId('saved-items')).toContainText(
    JSON.stringify(savedPassword)
  )
  const savedItems = JSON.parse(
    await page.getByTestId('saved-items').innerText()
  )
  expect(savedItems).toMatchObject([
    { loginCredentials: { label: 'Work Google account — primary' } }
  ])
})

test('validates generator options and respects the selected character types', async ({
  page
}) => {
  await page.goto('/?scenario=add-item')
  const generate = page.getByRole('button', {
    name: 'Generate password',
    exact: true
  })
  const length = page.getByRole('spinbutton', { name: 'Length', exact: true })
  for (const invalidLength of ['', '4', '129', '12.5']) {
    await length.fill(invalidLength)
    await expect(generate).toBeDisabled()
    await expect(
      page.getByText('Choose a length between 5 and 128.')
    ).toBeVisible()
  }
  await length.fill('32')
  for (const label of ['Uppercase', 'Lowercase', 'Symbols', 'Numbers']) {
    await page.getByRole('checkbox', { name: label, exact: true }).uncheck()
  }
  await expect(generate).toBeDisabled()
  await expect(
    page.getByText('Select at least one character type.')
  ).toBeVisible()
  await page.getByRole('checkbox', { name: 'Numbers', exact: true }).check()
  await generate.click()
  await expect(page.locator('input[name="password"]')).toHaveValue(/^\d{32}$/)
  await expect(
    page.getByRole('heading', { name: 'New vault item' })
  ).toBeVisible()
})

test('keeps form data on save failure and supports retry', async ({ page }) => {
  await page.goto('/?scenario=add-item&save-error=1')
  await fillLogin(page)
  await page.getByRole('button', { name: 'Save login', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'Could not save on this device. Please try again.'
  )
  await expect(
    page.getByRole('textbox', { name: 'Username or email' })
  ).toHaveValue('alex@example.com')
  await expect(
    page.getByRole('button', { name: 'Save login', exact: true })
  ).toBeEnabled()
  await page.getByRole('button', { name: 'Simulate storage recovery' }).click()
  await page.getByRole('button', { name: 'Save login', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('1 item saved')
})

test('fits mobile and keeps the save action reachable in short desktop windows', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?scenario=add-item')
  await fillLogin(page)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
  await page.screenshot({
    path: '../docs/screenshots/add-item-mobile.png',
    fullPage: true
  })
  await page.setViewportSize({ width: 320, height: 640 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(320)
  await page.setViewportSize({ width: 1440, height: 600 })
  const save = page.getByRole('button', { name: 'Save login', exact: true })
  await save.scrollIntoViewIfNeeded()
  await expect(save).toBeInViewport()
})

test('supports authenticator selection, account limits, and URL prefilling', async ({
  page
}) => {
  await page.goto('/?scenario=add-item#/addItem?url=https%3A%2F%2Fexample.com')
  await expect(page.getByRole('textbox', { name: 'Website' })).toHaveValue(
    'https://example.com'
  )
  await page.getByRole('radio', { name: 'Authenticator', exact: true }).check()
  await expect(page.getByLabel('Secret', { exact: true })).toBeVisible()
  await page.getByRole('radio', { name: 'Login', exact: true }).check()
  await expect(page.getByRole('textbox', { name: 'Website' })).toHaveValue(
    'https://example.com'
  )
  await page.goto('/?scenario=add-item&totp-limit=1')
  await expect(
    page.getByRole('radio', { name: 'Authenticator', exact: true })
  ).toBeDisabled()
  await expect(
    page.getByRole('link', { name: 'Account Limits', exact: true }).last()
  ).toBeVisible()
  await page.goto('/?scenario=add-item&logins-only=1')
  await expect(
    page.getByRole('heading', { name: 'Login details' })
  ).toBeVisible()
  await expect(page.getByRole('group', { name: 'Item type' })).toHaveCount(0)
})
