import { expect, test } from '@playwright/test'

test.use({ channel: 'chromium' })

test('renders a stored passkey without exposing a password or private key', async ({
  page
}) => {
  await page.setViewportSize({ width: 900, height: 720 })
  await page.goto('/?scenario=passkey-vault')
  await expect(page.getByText('github.com', { exact: true })).toBeVisible()
  await expect(
    page.getByText('alex@example.com', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Delete passkey' })
  ).toBeVisible()
  await expect(page.locator('input')).toHaveCount(0)
  await page.screenshot({ path: '../docs/screenshots/passkey-vault.png' })
})
