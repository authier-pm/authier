import { expect, test } from '@playwright/test'

test('verifies identity before saving a passkey', async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 660 })
  await page.goto('/?scenario=passkey-approval')
  await expect(
    page.getByRole('heading', { name: 'Save a passkey in Authier' })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Continue', exact: true })
  ).toBeDisabled()
  await page.getByLabel('Master password').fill('preview-password')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(
    page.getByText('alex@example.com', { exact: true })
  ).toBeVisible()
  await page.screenshot({ path: '../docs/screenshots/passkey-approval.png' })
  await page.getByRole('button', { name: 'Save passkey', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Continue in your browser.')
})

test('chooses among synced passkeys and can use another provider', async ({
  page
}) => {
  await page.goto('/?scenario=passkey-approval&operation=get')
  await page.getByLabel('Master password').fill('preview-password')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('radio', { name: /alex@work.example/ }).check()
  await expect(
    page.getByRole('radio', { name: /alex@work.example/ })
  ).toBeChecked()
  await page.getByRole('button', { name: 'Use another provider' }).click()
  await expect(page.getByRole('status')).toHaveText('Continue in your browser.')
})
