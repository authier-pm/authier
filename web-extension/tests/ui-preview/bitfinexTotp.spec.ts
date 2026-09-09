import { expect, test } from '@playwright/test'

test.use({ channel: 'chromium' })

test('removes the account selector on the OTP step and fills the exact code', async ({
  page
}) => {
  await page.setViewportSize({ width: 1050, height: 760 })
  await page.goto('/?scenario=bitfinex-totp')
  await expect(page.locator('.authier-dropdown')).toBeVisible()
  await page
    .getByRole('button', { name: 'Continue to two-factor authentication' })
    .click()
  await expect(page.locator('.authier-dropdown')).not.toBeVisible()
  await page.getByRole('button', { name: 'Autofill demo TOTP' }).click()
  await expect(page.getByRole('status')).toContainText('Exact code verified')
  for (const [index, digit] of [...'481502'].entries()) {
    await expect(
      page.getByRole('textbox', { name: `OTP digit ${index + 1}` })
    ).toHaveValue(digit)
  }
  await expect(page.locator('.authier-dropdown')).not.toBeVisible()
  await page.screenshot({ path: '../docs/screenshots/bitfinex-totp.png' })
})
