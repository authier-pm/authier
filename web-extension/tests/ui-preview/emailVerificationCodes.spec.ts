import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import {
  formattedEmailCodeBodies,
  gmailUnreadVerificationEmail
} from '../../ui-preview/fixtures/gmailVerificationEmail'

test.use({
  viewport: { width: 920, height: 700 },
  permissions: ['clipboard-read', 'clipboard-write']
})

test.beforeEach(async ({ page }) => {
  await page.route('https://icons.duckduckgo.com/ip3/*', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      path: resolve('ui-preview/fixtures/exampleFavicon.svg')
    })
  )
})

test('detects Gmail, masks the code, copies and reveals it, and clears the badge', async ({
  page
}) => {
  await page.goto('/?scenario=email-verification-codes')
  const popup = page.locator('[data-preview-popup]')
  await expect(popup.getByText('213***', { exact: true })).toBeVisible()
  await expect(popup.getByText('213456', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('New email verification code')).toBeVisible()
  await expect(
    popup.getByText('Email codes are available across tabs', { exact: false })
  ).toHaveCount(0)
  const favicon = popup.getByRole('img', { name: 'example.com favicon' })
  await expect(favicon).toHaveAttribute(
    'src',
    'https://icons.duckduckgo.com/ip3/example.com.ico'
  )
  await expect(favicon).toBeVisible()
  await expect(favicon).toHaveJSProperty('naturalWidth', 32)
  await page.screenshot({
    path: '../docs/screenshots/email-verification-codes.png'
  })
  await popup
    .getByRole('button', {
      name: 'Copy Gmail verification code from someone@example.com'
    })
    .click()
  await expect(popup.getByText('213456', { exact: true })).toBeVisible()
  await expect(popup.getByRole('status')).toHaveText('Copied to clipboard')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '213456'
  )
  await expect(page.getByLabel('New email verification code')).toHaveCount(0)
  await page.screenshot({
    path: '../docs/screenshots/email-verification-codes-copied.png'
  })
  await popup
    .getByRole('button', {
      name: 'Dismiss verification code from someone@example.com'
    })
    .click()
  await expect(
    popup.getByRole('region', { name: 'Email verification codes' })
  ).toHaveCount(0)
  await page.locator('[data-gmail-fixture] strong').evaluate((element) => {
    element.textContent = '213456'
  })
  await page.waitForTimeout(400)
  await expect(page.getByLabel('New email verification code')).toHaveCount(0)
})

test('clicking the sender favicon activates Gmail without copying or revealing the code', async ({
  page
}) => {
  await page.goto('/?scenario=email-verification-codes')
  const popup = page.locator('[data-preview-popup]')
  await page.evaluate(() =>
    navigator.clipboard.writeText('untouched clipboard')
  )
  await expect(
    page.getByText('Gmail · open in another tab', { exact: true })
  ).toBeVisible()
  await popup
    .getByRole('button', {
      name: 'Open Gmail for email from someone@example.com'
    })
    .click()
  await expect(
    page.getByText('Gmail · active tab', { exact: true })
  ).toBeVisible()
  await expect(popup.getByText('213***', { exact: true })).toBeVisible()
  await expect(page.getByLabel('New email verification code')).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'untouched clipboard'
  )
})

test('uses a clickable mail icon when the sender favicon is unavailable', async ({
  page
}) => {
  await page.route('https://icons.duckduckgo.com/ip3/*', (route) =>
    route.abort()
  )
  await page.goto('/?scenario=email-verification-codes')
  const sourceButton = page.getByRole('button', {
    name: 'Open Gmail for email from someone@example.com'
  })
  await expect(sourceButton.getByLabel('Email icon')).toBeVisible()
  await expect(
    sourceButton.getByRole('img', { name: 'example.com favicon' })
  ).toHaveCount(0)
  await sourceButton.click()
  await expect(
    page.getByText('Gmail · active tab', { exact: true })
  ).toBeVisible()
})

test('detects a later unread inbox email while the popup is already open', async ({
  page
}) => {
  await page.goto('/?scenario=email-verification-codes')
  const popup = page.locator('[data-preview-popup]')
  await expect(popup.getByText('213***', { exact: true })).toBeVisible()
  await page.locator('[data-gmail-fixture]').evaluate((element, fixture) => {
    element.innerHTML = fixture
  }, gmailUnreadVerificationEmail)
  await expect(popup.getByText('A7B*****', { exact: true })).toBeVisible()
  await popup
    .getByRole('button', {
      name: 'Copy Gmail verification code from login@example.org'
    })
    .click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'A7B8C9D0'
  )
  await expect(page.getByLabel('New email verification code')).toBeVisible()
})

test('copies normalized codes from different real browser HTML layouts', async ({
  page
}) => {
  await page.goto('/?scenario=email-verification-codes')
  const popup = page.locator('[data-preview-popup]')
  await popup
    .getByRole('button', {
      name: 'Dismiss verification code from someone@example.com'
    })
    .click()
  for (const [index, fixture] of formattedEmailCodeBodies.entries()) {
    const sender = `layout-${index}@example.com`
    await page.locator('[data-gmail-fixture]').evaluate(
      (element, { html, sender }) => {
        element.querySelector('.gD')!.setAttribute('email', sender)
        element.querySelector('.a3s')!.innerHTML = html
      },
      { html: fixture.html, sender }
    )
    await popup
      .getByRole('button', {
        name: `Copy Gmail verification code from ${sender}`
      })
      .click()
    expect(
      await page.evaluate(() => navigator.clipboard.readText()),
      fixture.name
    ).toBe(fixture.code)
    await popup
      .getByRole('button', { name: `Dismiss verification code from ${sender}` })
      .click()
  }
})

test('keeps the code masked and badge pending if clipboard access fails', async ({
  page
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Permission denied')) }
    })
  })
  await page.goto('/?scenario=email-verification-codes')
  const popup = page.locator('[data-preview-popup]')
  await popup
    .getByRole('button', {
      name: 'Copy Gmail verification code from someone@example.com'
    })
    .click()
  await expect(popup.getByRole('alert')).toHaveText(
    'Could not copy the code. Please try again.'
  )
  await expect(popup.getByText('213***', { exact: true })).toBeVisible()
  await expect(page.getByLabel('New email verification code')).toBeVisible()
})

test('removes an expired code from an open popup and clears the badge', async ({
  page
}) => {
  await page.clock.install()
  await page.goto('/?scenario=email-verification-codes')
  await expect(
    page.locator('[data-preview-popup]').getByText('213***', { exact: true })
  ).toBeVisible()
  await page.clock.fastForward(10 * 60 * 1000 + 1000)
  await expect(
    page.getByRole('region', { name: 'Email verification codes' })
  ).toHaveCount(0)
  await expect(page.getByLabel('New email verification code')).toHaveCount(0)
})
