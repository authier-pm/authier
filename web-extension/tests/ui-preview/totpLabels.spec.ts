import { expect, test } from '@playwright/test'

test.use({ channel: 'chromium', viewport: { width: 1020, height: 800 } })

for (const source of ['qr', 'page', 'session']) {
  test(`includes the account email from the ${source}`, async ({ page }) => {
    await page.goto(`/?scenario=totp-labels&source=${source}`)
    if (source === 'session') {
      await page
        .getByLabel('Email', { exact: true })
        .fill('last-entered@example.com')
      await page.getByRole('button', { name: 'Continue to setup' }).click()
      await expect(page.getByLabel('Email', { exact: true })).toHaveCount(0)
    }
    await page
      .getByRole('button', { name: 'Add QR TOTP from current page' })
      .click()
    await expect(page.getByRole('status')).toHaveText(
      'TOTP added to your vault'
    )
    const email =
      source === 'session'
        ? 'last-entered@example.com'
        : 'gael@frankobusiness.com'
    await expect(page.locator('[data-totp-label]')).toHaveText(
      `${email} | Microsoft`
    )
    if (source === 'page') {
      await page.screenshot({
        path: '../docs/screenshots/totp-account-label.png'
      })
    }
  })
}

test('asks for an email only when every automatic source is missing', async ({
  page
}) => {
  await page.goto('/?scenario=totp-labels&source=missing')
  await page
    .getByRole('button', { name: 'Add QR TOTP from current page' })
    .click()
  await expect(
    page.getByRole('button', { name: 'Add TOTP', exact: true })
  ).toBeDisabled()
  await page.getByLabel('Account email').fill('second@example.com')
  await expect(page.locator('[data-totp-label]')).toHaveText(
    'second@example.com | Microsoft'
  )
  await page.screenshot({
    path: '../docs/screenshots/totp-account-email-prompt.png'
  })
  await page.getByRole('button', { name: 'Add TOTP', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('TOTP added to your vault')
})
