import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 1040, height: 760 },
  permissions: ['clipboard-read', 'clipboard-write']
})

test('shows SMS codes from Google Messages and an Android phone, masked until copied', async ({
  page
}) => {
  await page.goto('/?scenario=sms-verification-codes')
  const popup = page.locator('[data-preview-popup]')
  const sms = popup.getByRole('region', { name: 'SMS verification codes' })
  for (const masked of ['474***', '482***', '594***']) {
    await expect(sms.getByText(masked, { exact: true })).toBeVisible()
  }
  // The open thread's older code and the bank card number never appear.
  await expect(popup.getByText(/^111/)).toHaveCount(0)
  await expect(popup.getByText(/^567/)).toHaveCount(0)
  await expect(sms.getByText('SMS code · Google Pixel 9')).toBeVisible()
  await expect(
    sms.getByRole('img', { name: 'Relayed from Google Pixel 9' })
  ).toBeVisible()
  await expect(page.getByLabel('New SMS verification code')).toBeVisible()
  await page.screenshot({
    path: '../docs/screenshots/sms-verification-codes.png'
  })

  await sms
    .getByRole('button', { name: 'Copy SMS verification code from AirBank' })
    .click()
  await expect(sms.getByText('474230', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '474230'
  )
  await sms
    .getByRole('button', { name: 'Copy SMS verification code from Moneta' })
    .click()
  await expect(sms.getByText('594172', { exact: true })).toBeVisible()
  await page.screenshot({
    path: '../docs/screenshots/sms-verification-codes-copied.png'
  })
})

test('picks up a code the phone relays while the popup is open', async ({
  page
}) => {
  await page.goto('/?scenario=sms-verification-codes')
  const popup = page.locator('[data-preview-popup]')
  await expect(popup.getByText('594***', { exact: true })).toBeVisible()
  await page
    .getByRole('button', { name: 'Receive an SMS on the phone' })
    .click()
  // The popup polls for relayed codes every few seconds.
  await expect(popup.getByText('4***', { exact: true })).toBeVisible({
    timeout: 6_000
  })
  await popup
    .getByRole('button', { name: 'Copy SMS verification code from Revolut' })
    .click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('4827')
})

test('dismisses all older phone codes from both web and Android sources', async ({
  page
}) => {
  await page.clock.install()
  await page.goto('/?scenario=sms-verification-codes')
  const sms = page.getByRole('region', { name: 'SMS verification codes' })
  const dismiss = sms.getByRole('button', {
    name: 'Dismiss all 3 temp codes',
    exact: true
  })
  await expect(dismiss).toBeVisible()
  await page.clock.runFor(1000)
  await dismiss.click()
  await expect(sms).toHaveCount(0)
  await expect(page.getByLabel('New SMS verification code')).toHaveCount(0)
  // The next phone poll must not restore dismissed codes.
  await page.clock.runFor(4000)
  await expect(sms).toHaveCount(0)
})

test('badges a phone relay with the popup closed and shows it on opening', async ({
  page
}) => {
  await page.clock.install()
  await page.goto('/?scenario=sms-verification-codes&phone-only=1')
  await expect(
    page.getByText('Popup closed · background checks stay active')
  ).toBeVisible()
  await expect(page.locator('[data-preview-popup]')).toHaveCount(0)
  await expect(page.getByLabel('New SMS verification code')).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Receive an SMS on the phone' })
    .click()
  await page.clock.runFor(30_000)
  await expect(page.getByLabel('New SMS verification code')).toBeVisible()
  await expect(page.locator('[data-preview-popup]')).toHaveCount(0)
  await page.screenshot({
    path: '../docs/screenshots/sms-background-badge.png'
  })
  await page.getByRole('button', { name: 'Open popup' }).click()
  const popup = page.locator('[data-preview-popup]')
  await expect(popup.getByText('4***', { exact: true })).toBeVisible()
  await popup
    .getByRole('button', { name: 'Copy SMS verification code from Revolut' })
    .click()
  await expect(page.getByLabel('New SMS verification code')).toHaveCount(0)
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('4827')
})

test('opens Google Messages from the SMS icon without copying the code', async ({
  page
}) => {
  await page.goto('/?scenario=sms-verification-codes')
  await page.evaluate(() =>
    navigator.clipboard.writeText('untouched clipboard')
  )
  await expect(
    page.getByText('Google Messages for Web · open in another tab')
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Open Google Messages for SMS from AirBank' })
    .click()
  await expect(
    page.getByText('Google Messages for Web · active tab')
  ).toBeVisible()
  await expect(
    page.locator('[data-preview-popup]').getByText('474***', { exact: true })
  ).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'untouched clipboard'
  )
})
